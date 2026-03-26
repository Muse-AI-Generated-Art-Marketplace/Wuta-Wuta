jest.mock('axios', () => ({
  post: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../../src/store/walletStore', () => ({
  useWalletStore: {
    getState: jest.fn(),
  },
}));

const axios = require('axios');

const {
  pinFileToIPFS,
  pinMetadataToIPFS,
  buildNFTMetadata,
  uploadArtworkToIPFS,
  verifyCIDPinned,
  fetchMetadataFromIPFS,
} = require('../../src/services/ipfsService');

const { useWalletStore } = require('../../src/store/walletStore');

const MOCK_IMAGE_CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
const MOCK_METADATA_CID = 'bafybeiczsscdsbs7ffqz55asqdf3smv6klcw3gofszvwlyarci47bgf354';

beforeEach(() => {
  process.env.REACT_APP_PINATA_JWT = 'test-jwt-token';
  global.crypto = {
    randomUUID: jest.fn(() => 'test-nonce'),
    subtle: {
      digest: jest.fn(async () => new Uint8Array(32).buffer),
    },
  };
  useWalletStore.getState.mockReturnValue({
    address: 'GBRPYHIL2C73WPV4N5JHXI6QH4PCME4SOZPFAEIGLUJ4CDYFYKJFDYQ4',
    isConnected: true,
    signMessage: jest.fn().mockResolvedValue('signed-upload'),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('pinFileToIPFS', () => {
  it('returns the IPFS CID on success', async () => {
    axios.post.mockResolvedValueOnce({ data: { IpfsHash: MOCK_IMAGE_CID } });

    const file = new Blob(['fake-image-data'], { type: 'image/png' });
    const cid = await pinFileToIPFS(file, 'artwork-001');

    expect(cid).toBe(MOCK_IMAGE_CID);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/pinning/pinFileToIPFS'),
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    );
  });
});

describe('pinMetadataToIPFS', () => {
  it('returns the metadata CID on success', async () => {
    axios.post.mockResolvedValueOnce({ data: { IpfsHash: MOCK_METADATA_CID } });

    const metadata = { name: 'Test Art', image: `ipfs://${MOCK_IMAGE_CID}` };
    const cid = await pinMetadataToIPFS(metadata, 'artwork-001');

    expect(cid).toBe(MOCK_METADATA_CID);
  });
});

describe('buildNFTMetadata', () => {
  it('includes the expected NFT fields', () => {
    const meta = buildNFTMetadata({
      name: 'Dreamscape #001',
      description: 'A collaborative piece',
      imageCID: MOCK_IMAGE_CID,
      artistAddress: 'GBRPYHIL2C73WPV4N5JHXI6QH4PCME4SOZPFAEIGLUJ4CDYFYKJFDYQ4',
      aiModel: 'Stable Diffusion',
      collaborators: ['GCOLLABORATOR'],
    });

    expect(meta.image).toBe(`ipfs://${MOCK_IMAGE_CID}`);
    expect(meta.artist).toContain('GBRPYH');
    expect(meta.attributes.find((item) => item.trait_type === 'AI Model')?.value).toBe('Stable Diffusion');
  });
});

describe('uploadArtworkToIPFS', () => {
  it('uses the signed Muse upload flow', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { challenge: 'sign-this' } })
      .mockResolvedValueOnce({
        data: {
          data: {
            imageCID: MOCK_IMAGE_CID,
            metadataCID: MOCK_METADATA_CID,
            tokenURI: `ipfs://${MOCK_METADATA_CID}`,
            verified: true,
          },
        },
      });

    const file = new Blob(['img'], { type: 'image/png' });
    const result = await uploadArtworkToIPFS(file, {
      artworkId: 'test-001',
      name: 'Test Art',
      description: 'Desc',
      artistAddress: 'GBRPYHIL2C73WPV4N5JHXI6QH4PCME4SOZPFAEIGLUJ4CDYFYKJFDYQ4',
      aiModel: 'DALL-E 3',
    });

    expect(result.imageCID).toBe(MOCK_IMAGE_CID);
    expect(axios.post.mock.calls[0][0]).toContain('/api/muse/upload/challenge');
    expect(axios.post.mock.calls[1][0]).toContain('/api/muse/upload');
  });
});

describe('verifyCIDPinned', () => {
  it('returns true when Pinata reports count > 0', async () => {
    axios.get.mockResolvedValueOnce({ data: { count: 1 } });
    await expect(verifyCIDPinned(MOCK_METADATA_CID)).resolves.toBe(true);
  });
});

describe('fetchMetadataFromIPFS', () => {
  it('fetches and returns parsed metadata JSON', async () => {
    const mockMeta = { name: 'Dreamscape', image: `ipfs://${MOCK_IMAGE_CID}` };
    axios.get.mockResolvedValueOnce({ data: mockMeta });

    await expect(fetchMetadataFromIPFS(MOCK_METADATA_CID)).resolves.toEqual(mockMeta);
  });
});
