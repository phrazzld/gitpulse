import { cn } from "../utils/cn";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional class names", () => {
    expect(cn("class1", false && "class2", true && "class3")).toBe(
      "class1 class3",
    );
  });

  it("should handle object notation", () => {
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
  });

  it("should handle array notation", () => {
    expect(cn("class1", ["class2", "class3"])).toBe("class1 class2 class3");
  });

  it("should resolve Tailwind class conflicts correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("px-4 py-2", "p-6")).toBe("p-6");
  });

  it("should handle mixed cases properly", () => {
    const condition = true;
    expect(
      cn("base-class", condition && "conditional-class", {
        "object-class": true,
        "unused-class": false,
      }),
    ).toBe("base-class conditional-class object-class");
  });
});
