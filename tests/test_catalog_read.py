import copy
import hashlib
import io
import json
import os
from unittest.mock import Mock

import pytest
import requests
from PIL import Image

from presentation_builder.assets import AssetManager
from presentation_builder.catalog_read import CatalogReadClient, CatalogReadError
from presentation_jobs.batch_20260921 import PRODUCTS


def catalogue_product(name='Assisi Beige', slug='assisi-beige', lifestyle_count=1, image_count=4):
    # Synthetic fixtures, never presented as live catalogue results.
    images = [{'image_url': f'https://assets.example/{slug}/{i}.png'} for i in range(image_count)]
    return {
        'product_id': slug + '-id', 'product_name': name, 'slug': slug,
        'primary_image': {**images[0], 'image_type': 'thumbnail'},
        'images': images, 'lifestyle_images': images[-lifestyle_count:],
        'collection': {'technical_spec_pdf_url': f'https://assets.example/{slug}/technical.pdf'},
    }


@pytest.fixture
def http(monkeypatch):
    monkeypatch.setenv('INNER_SPACE_CATALOG_AGENT_TOKEN', 'mock-token')
    monkeypatch.setenv('INNER_SPACE_CATALOG_READ_URL', 'https://catalog.example/read')
    post = Mock()
    monkeypatch.setattr(requests, 'post', post)
    monkeypatch.setattr(requests, 'get', Mock(side_effect=AssertionError('Unexpected asset download or scraping')))
    return post


def reply(data, status=200):
    response = Mock(status_code=status)
    response.json.return_value = data
    return response


@pytest.mark.parametrize('key,slug,lifestyles,images', [
    ('assisi', 'assisi-beige', 1, 4), ('roma', 'roma-stone-beige-beige', 2, 3),
])
@pytest.mark.parametrize('by_slug', [False, True])
def test_catalogue_assets_replace_legacy_urls(http, tmp_path, key, slug, lifestyles, images, by_slug):
    original = copy.deepcopy(PRODUCTS)
    product = catalogue_product(PRODUCTS[key]['name'], slug, lifestyles, images)
    replies = [reply({'ok': True, 'product': product})]
    if not by_slug:
        replies.insert(0, reply({'ok': True, 'items': [
            {'product_id': product['product_id'], 'product_name': product['product_name'],
             'slug': slug, 'primary_image': product['primary_image']},
        ]}))
    http.side_effect = replies
    supplied = {**PRODUCTS[key], **({'slug': slug} if by_slug else {})}
    manager = AssetManager({key: supplied}, tmp_path)
    resolved = manager.resolve(key)
    assert resolved['asset_source'] == 'catalog-read'
    assert resolved['image'] == product['primary_image']['image_url']
    assert resolved['life'] == product['lifestyle_images'][0]['image_url']
    assert resolved['lifestyle_images'] == product['lifestyle_images']
    assert resolved['images'] == product['images']
    assert resolved['technical_spec_pdf_url'] == product['collection']['technical_spec_pdf_url']
    assert resolved['short'] == supplied['short']
    assert manager.resolve(key) is resolved  # One catalogue resolution per manager/product.
    assert PRODUCTS == original  # Preserve the approved metadata snapshot.
    assert http.call_count == (1 if by_slug else 2)
    assert http.call_args.kwargs['json'] == {'action': 'product', 'slug': slug}
    assert http.call_args.args == ('https://catalog.example/read',)
    assert http.call_args.kwargs['headers']['x-inner-space-agent-token'] == 'mock-token'
    assert http.call_args.kwargs['allow_redirects'] is False
    requests.get.assert_not_called()


@pytest.mark.parametrize('nested', [False, True])
def test_sku_hydrates_authoritative_product(http, nested):
    product = catalogue_product()
    variant = {'sku': 'NL0212', 'product': {'product_id': product['product_id']},
               'primary_image': {'image_url': 'https://assets.example/variant.png'}}
    http.side_effect = [reply({'ok': True, **({'variant': variant} if nested else variant)}),
                        reply({'ok': True, 'product': product})]
    assert CatalogReadClient().resolve(sku='NL0212')['product_name'] == 'Assisi Beige'
    assert http.call_args_list[0].kwargs['json'] == {'action': 'variant', 'sku': 'NL0212'}
    assert http.call_args_list[1].kwargs['json'] == {'action': 'product', 'product_id': product['product_id']}


@pytest.mark.parametrize('status', [301, 401, 403, 404, 429, 500])
def test_http_failure_never_reuses_legacy_assets(http, tmp_path, status):
    http.return_value = reply({}, status)
    with pytest.raises(CatalogReadError, match=f'HTTP {status}'):
        AssetManager(PRODUCTS, tmp_path).get('assisi', 'image')
    requests.get.assert_not_called()


def test_missing_token_fails_before_http(http, monkeypatch, tmp_path):
    monkeypatch.delenv('INNER_SPACE_CATALOG_AGENT_TOKEN')
    with pytest.raises(CatalogReadError, match='INNER_SPACE_CATALOG_AGENT_TOKEN'):
        AssetManager(PRODUCTS, tmp_path).get('assisi', 'image')
    http.assert_not_called()
    requests.get.assert_not_called()


@pytest.mark.parametrize('payload', [
    {'ok': False}, {'ok': True}, {'ok': True, 'items': 'bad'},
    {'ok': True, 'products': []}, {'ok': True, 'results': []},
])
def test_invalid_response_blocks_fallback(http, tmp_path, payload):
    http.return_value = reply(payload)
    with pytest.raises(CatalogReadError):
        AssetManager(PRODUCTS, tmp_path).get('assisi', 'image')
    requests.get.assert_not_called()


def test_timeout_blocks_fallback(http, tmp_path):
    http.side_effect = requests.Timeout()
    with pytest.raises(CatalogReadError, match='request failed'):
        AssetManager(PRODUCTS, tmp_path).get('assisi', 'image')
    requests.get.assert_not_called()


@pytest.mark.parametrize('results', [
    [catalogue_product(), catalogue_product()],
    [catalogue_product('Assisi Grey', 'assisi-grey')],
])
def test_ambiguous_or_inexact_search_requires_identity(http, results):
    http.return_value = reply({'ok': True, 'items': results})
    with pytest.raises(CatalogReadError, match='unambiguous'):
        CatalogReadClient().resolve(name='Assisi Beige')


def test_confirmed_absence_retains_supplied_urls(http, tmp_path):
    http.return_value = reply({'ok': True, 'items': []})
    resolved = AssetManager(PRODUCTS, tmp_path).resolve('assisi')
    assert resolved['asset_source'] == 'supplied_urls'
    assert resolved['image'] == PRODUCTS['assisi']['image']
    requests.get.assert_not_called()


def test_missing_primary_does_not_use_other_images(http, tmp_path):
    product = catalogue_product()
    product['primary_image'] = None
    http.return_value = reply({'ok': True, 'product': product})
    with pytest.raises(CatalogReadError, match='primary_image'):
        AssetManager({'p': {'slug': product['slug']}}, tmp_path).get('p', 'image')
    requests.get.assert_not_called()


def test_missing_lifestyle_and_pdf_do_not_reuse_legacy_values(http, tmp_path):
    product = catalogue_product()
    product.update(lifestyle_images=[], collection=None)
    http.return_value = reply({'ok': True, 'product': product})
    manager = AssetManager({'p': {**PRODUCTS['assisi'], 'slug': product['slug'],
                                  'technical_spec_pdf_url': 'https://old.example/spec.pdf'}}, tmp_path)
    assert manager.resolve('p')['technical_spec_pdf_url'] is None
    with pytest.raises(RuntimeError, match='no catalogue life'):
        manager.get('p', 'life')
    requests.get.assert_not_called()


def test_download_uses_resolved_url_and_cache_tracks_url_changes(http, monkeypatch, tmp_path):
    product = catalogue_product()
    http.return_value = reply({'ok': True, 'product': product})
    content = io.BytesIO()
    Image.effect_noise((160, 160), 100).convert('RGB').save(content, 'PNG')
    download = Mock(return_value=Mock(content=content.getvalue()))
    monkeypatch.setattr(requests, 'get', download)
    (tmp_path / 'p_image.png').write_bytes(b'old generated cache' * 1000)
    digest = hashlib.sha256(product['primary_image']['image_url'].encode()).hexdigest()[:16]
    (tmp_path / f'p_image_{digest}.jpg').write_bytes(b'old normalized cache' * 1000)
    products = {'p': {'slug': product['slug']}}
    manager = AssetManager(products, tmp_path)
    manager.validate(['p'])
    first = manager.get('p', 'image')
    assert first.read_bytes() == content.getvalue()  # Same original PNG as pre-integration rendering.
    assert manager.get('p', 'image') == first
    assert download.call_count == 2  # Product + lifestyle; rendering uses cached bytes.
    assert download.call_args_list[0].args[0] == product['primary_image']['image_url']
    # A fresh manager must render identical bytes from the URL-specific cache.
    warm = AssetManager(products, tmp_path)
    warm.validate(['p'])
    assert warm.get('p', 'image').read_bytes() == first.read_bytes()
    assert download.call_count == 2
    product['primary_image']['image_url'] = 'https://assets.example/new-primary.png'
    second = AssetManager(products, tmp_path).get('p', 'image')
    assert second != first
    assert download.call_count == 3
    assert download.call_args.args[0] == product['primary_image']['image_url']


@pytest.mark.skipif(not os.getenv('INNER_SPACE_CATALOG_AGENT_TOKEN'), reason='Live catalogue token unavailable')
@pytest.mark.parametrize('identity,name,slug,image_count,lifestyle_count', [
    ({'slug': 'assisi-beige'}, 'Assisi Beige', 'assisi-beige', 4, 1),
    ({'name': 'Assisi Beige'}, 'Assisi Beige', 'assisi-beige', 4, 1),
    ({'slug': 'roma-stone-beige-beige'}, 'Roma Stone Beige', 'roma-stone-beige-beige', 3, 2),
    ({'name': 'Roma Stone Beige'}, 'Roma Stone Beige', 'roma-stone-beige-beige', 3, 2),
    ({'sku': 'NL0212'}, 'Assisi Beige', 'assisi-beige', 4, 1),
])
def test_live_asset_only_smoke(tmp_path, monkeypatch, identity, name, slug, image_count, lifestyle_count):
    # Calls only catalog-read POST. No PDF build, image download, scraping or generation.
    monkeypatch.setattr(requests, 'get', Mock(side_effect=AssertionError('Dry run must not download or scrape')))
    resolved = AssetManager({'p': identity}, tmp_path).resolve('p')
    print(json.dumps({
        'input': identity, 'source': resolved['asset_source'],
        'resolved_product': resolved['resolved_product'], 'primary_image_url': resolved['image'],
        'lifestyle_image_urls': [i['image_url'] for i in resolved['lifestyle_images']],
        'technical_pdf_url': resolved['technical_spec_pdf_url'],
        'website_scraping': False, 'generation': False,
    }, indent=2))
    assert resolved['asset_source'] == 'catalog-read'
    assert resolved['resolved_product']['product_name'] == name
    assert resolved['resolved_product']['slug'] == slug
    assert resolved['primary_image']['image_type'] == 'thumbnail'
    assert len(resolved['images']) == image_count
    assert len(resolved['lifestyle_images']) == lifestyle_count
