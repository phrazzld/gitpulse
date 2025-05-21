const getPort = require("get-port");
const http = require("http");
const handler = require("serve-handler");
const fs = require("fs");
const path = require("path");

// Mock external dependencies
jest.mock("get-port");
jest.mock("serve-handler");
jest.mock("fs");
jest.mock("child_process");

// Import after mocks are set up
const {
  startStaticServer,
  getRelevantStoryIds,
  cleanupAndExit,
} = require("../../accessibility/check-a11y-staged-stories-server");

describe("check-a11y-staged-stories server functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startStaticServer", () => {
    test("should start server on available port", async () => {
      const mockPort = 3001;
      const mockServer = {
        listen: jest.fn((port, host, callback) => callback()),
        on: jest.fn(),
      };

      getPort.mockResolvedValue(mockPort);
      jest.spyOn(http, "createServer").mockReturnValue(mockServer);

      const result = await startStaticServer("/path/to/static");

      expect(getPort).toHaveBeenCalled();
      expect(http.createServer).toHaveBeenCalled();
      expect(mockServer.listen).toHaveBeenCalledWith(
        mockPort,
        "127.0.0.1",
        expect.any(Function),
      );
      expect(result).toEqual({ server: mockServer, port: mockPort });
    });

    test("should handle server errors", async () => {
      const mockError = new Error("Server failed to start");
      const mockServer = {
        listen: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === "error") {
            callback(mockError);
          }
        }),
      };

      getPort.mockResolvedValue(3001);
      jest.spyOn(http, "createServer").mockReturnValue(mockServer);

      await expect(startStaticServer("/path/to/static")).rejects.toThrow(
        "Server failed to start",
      );
    });

    test("should use serve-handler for request handling", async () => {
      const mockRequest = {};
      const mockResponse = {};
      let serverHandler;

      const mockServer = {
        listen: jest.fn((port, host, callback) => callback()),
        on: jest.fn(),
      };

      jest.spyOn(http, "createServer").mockImplementation((handler) => {
        serverHandler = handler;
        return mockServer;
      });

      getPort.mockResolvedValue(3001);
      handler.mockResolvedValue();

      await startStaticServer("/path/to/static");

      // Test the handler
      await serverHandler(mockRequest, mockResponse);

      expect(handler).toHaveBeenCalledWith(mockRequest, mockResponse, {
        public: "/path/to/static",
        cleanUrls: false,
        etag: true,
        symlinks: false,
      });
    });
  });

  describe("getRelevantStoryIds", () => {
    test("should filter stories based on staged files", () => {
      const mockStories = {
        stories: {
          "button--primary": {
            importPath: "src/components/Button.stories.tsx",
          },
          "button--secondary": {
            importPath: "src/components/Button.stories.tsx",
          },
          "card--default": { importPath: "src/components/Card.stories.tsx" },
          "modal--default": { importPath: "src/components/Modal.stories.tsx" },
        },
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockStories));

      const stagedFiles = [
        "src/components/Button.stories.tsx",
        "src/components/Modal.stories.tsx",
      ];
      const result = getRelevantStoryIds(
        stagedFiles,
        "/path/to/storybook-static",
      );

      expect(result).toEqual([
        "button--primary",
        "button--secondary",
        "modal--default",
      ]);
    });

    test("should return empty array when no stories match", () => {
      const mockStories = {
        stories: {
          "card--default": { importPath: "src/components/Card.stories.tsx" },
        },
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockStories));

      const stagedFiles = ["src/components/Button.stories.tsx"];
      const result = getRelevantStoryIds(
        stagedFiles,
        "/path/to/storybook-static",
      );

      expect(result).toEqual([]);
    });

    test("should return null when stories.json is missing", () => {
      fs.existsSync.mockReturnValue(false);

      const result = getRelevantStoryIds(
        ["src/components/Button.stories.tsx"],
        "/path",
      );

      expect(result).toBeNull();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    test("should handle JSON parse errors", () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue("invalid json");

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const result = getRelevantStoryIds(
        ["src/components/Button.stories.tsx"],
        "/path",
      );

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error filtering stories:",
        expect.any(Error),
      );
    });
  });

  describe("cleanupAndExit", () => {
    test("should close server if running", async () => {
      const mockServer = {
        close: jest.fn((callback) => callback()),
      };

      // Instead of mocking process.exit, listen for the beforeExit event
      const exitHandler = jest.fn();
      process.once('beforeExit', exitHandler);
      
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Set the server via the module
      require("../../accessibility/check-a11y-staged-stories-server").setGlobalServer(
        mockServer,
      );

      await cleanupAndExit(0);

      expect(mockServer.close).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("\nCleaning up server...");
      expect(consoleSpy).toHaveBeenCalledWith("Server closed");
      expect(exitHandler).toHaveBeenCalledWith(0);

      // Cleanup
      require("../../accessibility/check-a11y-staged-stories-server").setGlobalServer(null);
    });

    test("should exit with code 1 by default", async () => {
      // Listen for the beforeExit event
      const exitHandler = jest.fn();
      process.once('beforeExit', exitHandler);

      await cleanupAndExit();

      expect(exitHandler).toHaveBeenCalledWith(1);
    });
  });
});
