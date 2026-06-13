import { interests } from "../interests";

describe("interests", () => {
  it("leads with AI product development", () => {
    expect(interests[0]).toBe("AI product development");
  });

  it("should have non-empty interest values", () => {
    expect(interests.length).toBeGreaterThan(0);
    interests.forEach((interest) => {
      expect(interest).toBeTruthy();
      expect(interest.length).toBeGreaterThan(0);
    });
  });
});
