/* eslint-disable @typescript-eslint/no-require-imports */
const { TestEnvironment } = require("jest-environment-jsdom");

class TestResponse extends Response {
  static json(data, init) {
    const status = init?.status ?? 200;
    if (status === 204 || status === 205 || status === 304) {
      return new Response(null, init);
    }
    return Response.json(data, init);
  }
}

class JSDOMEnvironmentWithWebApis extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.Headers = Headers;
    this.global.Request = Request;
    this.global.Response = TestResponse;
    this.global.fetch = fetch;
  }
}

module.exports = JSDOMEnvironmentWithWebApis;
