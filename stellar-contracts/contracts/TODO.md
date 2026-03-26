# Issue #38 Progress - Stellar Contracts

**Step 1 & 2 Complete**: ArtAsset struct defined in WutaWutaMarketplace.rs with id, owner, metadata_uri (IPFS), royalty_percentage + project fields. Storage/functions updated (get_art_asset, get_art_assets).

**Next**: Update tests and ArtAssetToken.rs, build/test.

**Remaining**:

- Update test_wutawuta.rs (Artwork -> ArtAsset refs)
- Integrate ArtAssetToken.rs with marketplace
- cargo build/test
- Git branch/PR
