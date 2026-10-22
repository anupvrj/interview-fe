import { describe, expect, it } from "vitest";
import { parseTags, serialiseTags } from "../TagListPopover";

describe("skill tags keep the stored shape", () => {
  it("arrays", () => {
    const { tags, shape } = parseTags(["Go", " Java ", ""]);
    expect(tags).toEqual(["Go", "Java"]);
    expect(serialiseTags([...tags, "Kafka"], shape)).toEqual(["Go", "Java", "Kafka"]);
  });

  it("comma strings", () => {
    const { tags, shape } = parseTags("Go, Java,  SQL");
    expect(tags).toEqual(["Go", "Java", "SQL"]);
    expect(serialiseTags(tags.slice(1), shape)).toBe("Java, SQL");
  });

  it("grouped lines stay whole", () => {
    const { tags, shape } = parseTags("Languages: Go, Java\nCloud: AWS, GCP");
    expect(tags).toEqual(["Languages: Go, Java", "Cloud: AWS, GCP"]);
    expect(serialiseTags(tags, shape)).toBe("Languages: Go, Java\nCloud: AWS, GCP");
  });

  it("HTML lists round-trip and escape", () => {
    const { tags, shape } = parseTags("<ul><li>R&amp;D</li><li><b>Go</b></li></ul>");
    expect(tags).toEqual(["R&D", "Go"]);
    expect(serialiseTags([...tags, "A<B"], shape)).toBe("<ul><li>R&amp;D</li><li>Go</li><li>A&lt;B</li></ul>");
  });
});
