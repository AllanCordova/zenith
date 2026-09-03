import axios from "axios";
import { api, getErrorMessage } from "./client";

describe("api client", () => {
  it("targets the same-origin BFF with credentials", () => {
    expect(api.defaults.baseURL).toBe("/api/v1");
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });
});

describe("getErrorMessage", () => {
  it("joins array messages from the API", () => {
    const error = new axios.AxiosError("Request failed");
    error.response = {
      data: { message: ["email must be an email", "password too short"] },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    };
    expect(getErrorMessage(error, "fallback")).toBe(
      "email must be an email password too short",
    );
  });

  it("uses a string message from the API", () => {
    const error = new axios.AxiosError("Request failed");
    error.response = {
      data: { message: "Unauthorized" },
      status: 401,
      statusText: "Unauthorized",
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    };
    expect(getErrorMessage(error, "fallback")).toBe("Unauthorized");
  });

  it("returns the fallback when there is no API message", () => {
    expect(getErrorMessage(new Error("network"), "Não foi possível entrar")).toBe(
      "Não foi possível entrar",
    );
  });
});
