"""Read-only catalogue asset resolution. Never scrapes or generates imagery."""
import os

import requests

DEFAULT_URL = 'https://uydxfxifaquwmltonhbl.supabase.co/functions/v1/catalog-read'


class CatalogReadError(RuntimeError):
    pass


class CatalogReadClient:
    def __init__(self):
        self.url = os.getenv('INNER_SPACE_CATALOG_READ_URL') or DEFAULT_URL
        self.token = os.getenv('INNER_SPACE_CATALOG_AGENT_TOKEN')

    def _post(self, **payload):
        if not self.token:
            raise CatalogReadError('INNER_SPACE_CATALOG_AGENT_TOKEN is required for catalogue resolution')
        try:
            response = requests.post(
                self.url, json=payload, timeout=30, allow_redirects=False,
                headers={'Content-Type': 'application/json',
                         'x-inner-space-agent-token': self.token},
            )
        except requests.RequestException:
            raise CatalogReadError('catalog-read request failed; asset fallback blocked') from None
        if response.status_code != 200:
            raise CatalogReadError(f'catalog-read HTTP {response.status_code}; asset fallback blocked')
        try:
            data = response.json()
        except ValueError:
            raise CatalogReadError('catalog-read returned invalid JSON') from None
        if not isinstance(data, dict) or data.get('ok') is not True:
            raise CatalogReadError('catalog-read did not confirm success; asset fallback blocked')
        return data

    def _product(self, **identity):
        data = self._post(action='product', **identity)
        if 'product' not in data or (data['product'] is not None and not isinstance(data['product'], dict)):
            raise CatalogReadError('catalog-read returned an invalid product response')
        return data['product']

    def resolve(self, *, slug=None, name=None, sku=None):
        # Explicit catalogue identifiers take precedence over legacy display copy.
        if slug:
            return self._product(slug=slug)
        if sku:
            data = self._post(action='variant', sku=sku)
            variant = data.get('variant', data)
            if variant is None:
                return None
            if not isinstance(variant, dict):
                raise CatalogReadError('catalog-read returned an invalid variant response')
            product = variant.get('product') or data.get('product') or {}
            product_id = product.get('product_id') or product.get('id') or variant.get('product_id')
            if product.get('slug'):
                return self._product(slug=product['slug'])
            if product_id:
                return self._product(product_id=product_id)
            raise CatalogReadError('catalog-read variant has no product identity')
        if not name:
            raise CatalogReadError('A product slug, name or SKU is required')
        data = self._post(action='search', query=name, limit=20)
        results = data.get('products', data.get('results'))
        if not isinstance(results, list) or any(not isinstance(p, dict) for p in results):
            raise CatalogReadError('catalog-read returned invalid search results')
        if not results:
            return None
        normalized = ' '.join(name.split()).casefold()
        matches = [p for p in results if ' '.join(str(p.get('product_name', '')).split()).casefold() == normalized]
        if len(matches) != 1:
            raise CatalogReadError(f'catalog-read needs an unambiguous slug or SKU for {name!r}')
        match = matches[0]
        if match.get('slug'):
            return self._product(slug=match['slug'])
        if match.get('product_id'):
            return self._product(product_id=match['product_id'])
        raise CatalogReadError('catalog-read search match has no product identity')


def resolve_assets(product, client):
    """Keep unmapped presentation copy; replace all asset fields on a match."""
    resolved = client.resolve(slug=product.get('slug'), name=product.get('name'), sku=product.get('sku'))
    if resolved is None:
        # Only a confirmed absence permits the existing supplied-URL path.
        return {**product, 'asset_source': 'supplied_urls'}
    primary = (resolved.get('primary_image') or {}).get('image_url')
    if not primary:
        raise CatalogReadError('Catalogue product has no authoritative primary_image')
    lifestyle = resolved.get('lifestyle_images') or []
    images = resolved.get('images') or []
    return {
        **product,
        'asset_source': 'catalog-read',
        'resolved_product': {k: resolved.get(k) for k in ('product_id', 'id', 'slug', 'product_name')},
        'image': primary,
        'life': next((i['image_url'] for i in lifestyle if i.get('image_url')), None),
        'primary_image': resolved['primary_image'],
        'lifestyle_images': lifestyle,
        'images': images,
        'technical_spec_pdf_url': (resolved.get('collection') or {}).get('technical_spec_pdf_url'),
    }
