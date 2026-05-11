import { describe, expect, it } from "vitest";
import { tmdbImage } from "@/lib/tmdb/client";
import { type TmdbSearchResult, tmdbOriginalTitle, tmdbTitle, tmdbYear } from "@/lib/tmdb/search";

const movie: TmdbSearchResult = {
  media_type: "movie",
  id: 157336,
  title: "Interstellar",
  original_title: "Interstellar",
  release_date: "2014-11-05",
};

const tv: TmdbSearchResult = {
  media_type: "tv",
  id: 76479,
  name: "The Boys",
  original_name: "The Boys",
  first_air_date: "2019-07-26",
};

const incompleteMovie: TmdbSearchResult = {
  media_type: "movie",
  id: 1,
  title: "Sin fecha",
};

describe("tmdb.tmdbImage", () => {
  it("returns null when path is missing", () => {
    expect(tmdbImage(null)).toBeNull();
    expect(tmdbImage(undefined)).toBeNull();
    expect(tmdbImage("")).toBeNull();
  });

  it("builds a TMDB CDN URL with the default size", () => {
    expect(tmdbImage("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });

  it("honors the size parameter", () => {
    expect(tmdbImage("/abc.jpg", "w500")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(tmdbImage("/abc.jpg", "original")).toBe("https://image.tmdb.org/t/p/original/abc.jpg");
  });
});

describe("tmdb.tmdbTitle", () => {
  it("returns the movie title", () => {
    expect(tmdbTitle(movie)).toBe("Interstellar");
  });

  it("returns the TV show name", () => {
    expect(tmdbTitle(tv)).toBe("The Boys");
  });
});

describe("tmdb.tmdbOriginalTitle", () => {
  it("returns the movie original_title", () => {
    expect(tmdbOriginalTitle(movie)).toBe("Interstellar");
  });

  it("returns the TV show original_name", () => {
    expect(tmdbOriginalTitle(tv)).toBe("The Boys");
  });
});

describe("tmdb.tmdbYear", () => {
  it("extracts the year from a movie's release_date", () => {
    expect(tmdbYear(movie)).toBe(2014);
  });

  it("extracts the year from a TV show's first_air_date", () => {
    expect(tmdbYear(tv)).toBe(2019);
  });

  it("returns null when the date is missing", () => {
    expect(tmdbYear(incompleteMovie)).toBeNull();
  });
});
