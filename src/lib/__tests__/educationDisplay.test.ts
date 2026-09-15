import { describe, expect, it } from "vitest";
import {
  flattenEducationFieldIntoDegree,
  flattenEducationList,
  shouldAppendEducationField,
} from "../educationDisplay";

describe("shouldAppendEducationField", () => {
  it("appends field when the degree has no major", () => {
    expect(shouldAppendEducationField("B.Tech", "CSE")).toBe(true);
    expect(
      shouldAppendEducationField("Bachelor of Technology (B.Tech.)", "CSE"),
    ).toBe(true);
  });

  it("does not append CSE when the degree already has Computer Science", () => {
    expect(
      shouldAppendEducationField(
        "Bachelor of Technology (B.Tech.) in Computer Science",
        "CSE",
      ),
    ).toBe(false);
  });

  it("does not append when the degree already includes the field text", () => {
    expect(shouldAppendEducationField("B.Tech in CSE", "CSE")).toBe(false);
  });

  it("does not append a second major when the degree already has 'in …'", () => {
    expect(
      shouldAppendEducationField(
        "Bachelor of Technology (B.Tech.) in Mechanical Engineering",
        "CSE",
      ),
    ).toBe(false);
  });

  it("does not append an empty field", () => {
    expect(shouldAppendEducationField("B.Tech", "")).toBe(false);
    expect(shouldAppendEducationField("B.Tech", undefined)).toBe(false);
  });
});

describe("flattenEducationFieldIntoDegree", () => {
  it("puts a hidden CSE field into Degree so it can be edited", () => {
    expect(
      flattenEducationFieldIntoDegree({
        degree: "Bachelor of Technology (B.Tech.) in Computer Science",
        field: "CSE",
      }),
    ).toEqual({
      degree: "Bachelor of Technology (B.Tech.) in Computer Science in CSE",
      field: "",
    });
  });

  it("does not duplicate a field already in the degree", () => {
    expect(
      flattenEducationFieldIntoDegree({
        degree: "B.Tech in CSE",
        field: "CSE",
      }),
    ).toEqual({ degree: "B.Tech in CSE", field: "" });
  });

  it("marks a list changed only when a hidden field is merged", () => {
    const { education, changed } = flattenEducationList([
      { degree: "B.Tech", field: "CSE" },
      { degree: "Intermediate (12th)", field: "" },
    ]);
    expect(changed).toBe(true);
    expect(education[0]).toEqual({ degree: "B.Tech in CSE", field: "" });
    expect(education[1]).toEqual({ degree: "Intermediate (12th)", field: "" });
  });
});
