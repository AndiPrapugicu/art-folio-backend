import { Test, TestingModule } from '@nestjs/testing';
import { ArtworksService } from './artworks.service';
import { Artwork } from '../artwork.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('ArtworksService', () => {
  let service: ArtworksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtworksService,
        {
          provide: getRepositoryToken(Artwork),
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((artwork) =>
                Promise.resolve({ id: 1, ...artwork }),
              ),
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<ArtworksService>(ArtworksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an artwork', async () => {
    const artwork: Partial<Artwork> = {
      title: 'My Artwork',
      description: 'This is a sample artwork description',
      category: 'Illustration',
      imageUrl: 'http://example.com/image.jpg',
      clientLink: 'http://client-link.com',
      isVisible: true,
    };
    const createdArtwork = await service.createArtwork(1, artwork);
    expect(createdArtwork).toEqual(expect.objectContaining(artwork));
  });

  it('should find artworks by user ID', async () => {
    const artwork: Partial<Artwork> = {
      title: 'My Artwork',
      description: 'This is a sample artwork description',
      category: 'Illustration',
      imageUrl: 'http://example.com/image.jpg',
      clientLink: 'http://client-link.com',
      isVisible: true,
    };
    await service.createArtwork(1, artwork);
    const artworks = await service.findArtworksByUser(1);
    expect(artworks).toContainEqual(expect.objectContaining(artwork));
  });
});
