import { describe, expect, it } from "vitest";
import { filterLeaderboardEntries, formatLeaderboardScore, maskLeaderboardEmail } from "../leaderboard";
import type { LeaderboardEntry } from "../api";

function entry(partial: Partial<LeaderboardEntry> & Pick<LeaderboardEntry, "name" | "email">): LeaderboardEntry {
  return {
    rank: 1,
    avgScore: 70,
    resumeScore: 80,
    interviewScore: 65,
    interviewSubmittedAt: null,
    isYou: false,
    ...partial,
  };
}

describe("leaderboard helpers", () => {
  it("formats one decimal and drops a trailing .0", () => {
    expect(formatLeaderboardScore(80.3)).toBe("80.3");
    expect(formatLeaderboardScore(78)).toBe("78");
    expect(formatLeaderboardScore(67.399)).toBe("67.4");
  });

  it("masks the mailbox and keeps the domain", () => {
    expect(maskLeaderboardEmail("interviewtrixofficial@gmail.com")).toBe("inte******@gmail.com");
    expect(maskLeaderboardEmail("ab@yahoo.com")).toBe("ab******@yahoo.com");
  });

  it("searches name and email", () => {
    const rows = [
      entry({ rank: 1, name: "Jaiwant Karrun", email: "jais******@gmail.com" }),
      entry({ rank: 2, name: "Salman Khan", email: "sami******@gmail.com" }),
    ];
    expect(filterLeaderboardEntries(rows, "jaisam710@gmail.com")).toHaveLength(1);
    expect(filterLeaderboardEntries(rows, "SALMAN")[0]?.email).toBe("sami******@gmail.com");
    expect(filterLeaderboardEntries(rows, "")).toHaveLength(2);
    expect(filterLeaderboardEntries(rows, "nobody")).toHaveLength(0);
  });
});
