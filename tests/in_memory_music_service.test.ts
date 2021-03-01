import { InMemoryMusicService } from "./in_memory_music_service";
import { AuthSuccess, MusicLibrary } from "../src/music_service";
import { v4 as uuid } from "uuid";
import {
  BOB_MARLEY,
  MADONNA,
  BLONDIE,
  METALLICA,
  ALL_ALBUMS,
} from "./builders";

describe("InMemoryMusicService", () => {
  const service = new InMemoryMusicService();

  describe("generateToken", () => {
    it("should be able to generate a token and then use it to log in", async () => {
      const credentials = { username: "bob", password: "smith" };

      service.hasUser(credentials);

      const token = (await service.generateToken(credentials)) as AuthSuccess;

      expect(token.userId).toEqual(credentials.username);
      expect(token.nickname).toEqual(credentials.username);

      const musicLibrary = service.login(token.authToken);

      expect(musicLibrary).toBeDefined();
    });

    it("should fail with an exception if an invalid token is used", async () => {
      const credentials = { username: "bob", password: "smith" };

      service.hasUser(credentials);

      const token = (await service.generateToken(credentials)) as AuthSuccess;

      service.clear();

      return expect(service.login(token.authToken)).rejects.toEqual(
        "Invalid auth token"
      );
    });
  });

  describe("Music Library", () => {
    const user = { username: "user100", password: "password100" };
    let musicLibrary: MusicLibrary;

    beforeEach(async () => {
      service.clear();

      service.hasArtists(BOB_MARLEY, MADONNA, BLONDIE, METALLICA);
      service.hasUser(user);

      const token = (await service.generateToken(user)) as AuthSuccess;
      musicLibrary = (await service.login(token.authToken)) as MusicLibrary;
    });

    describe("artists", () => {
      describe("fetching all", () => {
        it("should provide an array of artists", async () => {
          const artists = [
            { id: BOB_MARLEY.id, name: BOB_MARLEY.name },
            { id: MADONNA.id, name: MADONNA.name },
            { id: BLONDIE.id, name: BLONDIE.name },
            { id: METALLICA.id, name: METALLICA.name },
          ];
          expect(await musicLibrary.artists({})).toEqual({
            results: artists,
            total: 4,
          });
        });
      });

      describe("fetching the second page", () => {
        it("should provide an array of artists", async () => {
          const artists = [
            { id: BLONDIE.id, name: BLONDIE.name },
            { id: METALLICA.id, name: METALLICA.name },
          ];
          expect(await musicLibrary.artists({ _index: 2, _count: 2 })).toEqual({
            results: artists,
            total: 4,
          });
        });
      });

      describe("fetching the more items than fit on the second page", () => {
        it("should provide an array of artists", async () => {
          const artists = [
            { id: MADONNA.id, name: MADONNA.name },
            { id: BLONDIE.id, name: BLONDIE.name },
            { id: METALLICA.id, name: METALLICA.name },
          ];
          expect(
            await musicLibrary.artists({ _index: 1, _count: 50 })
          ).toEqual({ results: artists, total: 4 });
        });
      });
    });

    describe("artist", () => {
      describe("when it exists", () => {
        it("should provide an artist", () => {
          expect(musicLibrary.artist(MADONNA.id)).toEqual({
            id: MADONNA.id,
            name: MADONNA.name,
          });
          expect(musicLibrary.artist(BLONDIE.id)).toEqual({
            id: BLONDIE.id,
            name: BLONDIE.name,
          });
        });
      });

      describe("when it doesnt exist", () => {
        it("should provide an artist", () => {
          expect(() => musicLibrary.artist("-1")).toThrow(
            "No artist with id '-1'"
          );
        });
      });
    });

    describe("albums", () => {
      describe("fetching with no filtering", () => {
        it("should return all the albums for all the artists", async () => {
          expect(await musicLibrary.albums({})).toEqual({
            results: ALL_ALBUMS,
            total: ALL_ALBUMS.length,
          });
        });
      });

      describe("fetching for a single artist", () => {
        it("should return them all if the artist has some", async () => {
          expect(await musicLibrary.albums({ artistId: BLONDIE.id })).toEqual({
            results: BLONDIE.albums,
            total: BLONDIE.albums.length,
          });
        });

        it("should return empty list of the artists does not have any", async () => {
          expect(await musicLibrary.albums({ artistId: MADONNA.id })).toEqual({
            results: [],
            total: 0,
          });
        });

        it("should return empty list if the artist id is not valid", async () => {
          expect(await musicLibrary.albums({ artistId: uuid() })).toEqual({
            results: [],
            total: 0,
          });
        });
      });

      describe("fetching with just index", () => {
        it("should return everything after", async () => {
          const albums = [
            BOB_MARLEY.albums[2],
            ...BLONDIE.albums,
            ...MADONNA.albums,
            ...METALLICA.albums,
          ];
          expect(await musicLibrary.albums({ _index: 2 })).toEqual({
            results: albums,
            total: ALL_ALBUMS.length,
          });
        });
      });

      describe("fetching with just count", () => {
        it("should return first n items", async () => {
          const albums = [
            BOB_MARLEY.albums[0],
            BOB_MARLEY.albums[1],
            BOB_MARLEY.albums[2],
          ];
          expect(await musicLibrary.albums({ _count: 3 })).toEqual({
            results: albums,
            total: ALL_ALBUMS.length,
          });
        });
      });

      describe("fetching with index and count", () => {
        it("should be able to return the first page", async () => {
          const albums = [BOB_MARLEY.albums[0], BOB_MARLEY.albums[1]];
          expect(await musicLibrary.albums({ _index: 0, _count: 2 })).toEqual({
            results: albums,
            total: ALL_ALBUMS.length,
          });
        });
        it("should be able to return the second page", async () => {
          const albums = [BOB_MARLEY.albums[2], BLONDIE.albums[0]];
          expect(await musicLibrary.albums({ _index: 2, _count: 2 })).toEqual({
            results: albums,
            total: ALL_ALBUMS.length,
          });
        });
        it("should be able to return the last page", async () => {
          expect(await musicLibrary.albums({ _index: 5, _count: 2 })).toEqual({
            results: METALLICA.albums,
            total: ALL_ALBUMS.length,
          });
        });
      });
    });
  });
});
