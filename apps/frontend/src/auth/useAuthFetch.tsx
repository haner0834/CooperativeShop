import { useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getDeviceId } from "../utils/device";

/**
 * Custom error category used to encapsulate HTTP error information.
 * This error will be thrown when the API responds with a non-2xx status code.
 */
class HttpError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}

// Defines the options accepted by authedFetch, inherited from the native RequestInit.
type AuthFetchOptions = RequestInit & {
  /**
   * The number of times to retry a request if failed.
   * @default 1 (i.e. 1 initial request + 1 retry = 2 attempts in total)
   */
  retries?: number;
};

/**
 * A React Hook that encapsulates the authentication process,
 * providing a fetch function with automatic token refresh and retry mechanism.
 * @returns { authedFetch: (url: string, options?: AuthFetchOptions) => Promise<any> }
 */
export const useAuthFetch = () => {
  const { tokenRef, refreshAccessToken } = useAuth();

  const authedFetch = useCallback(
    async (url: string, options: AuthFetchOptions = {}) => {
      const { retries = 1, ...fetchOptions } = options;
      const maxAttempts = retries + 1;
      let lastError: Error | null = null;

      // Use a variable to store the currently valid token,
      // as it may be updated during the retry process.
      let tokenToUse = tokenRef.current;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const headers = new Headers(fetchOptions.headers);
        if (tokenToUse) {
          headers.set("Authorization", `Bearer ${tokenToUse}`);
        }
        // [UPDATE]: Set X-Device-ID header
        const deviceId = getDeviceId();
        headers.set("X-Device-ID", deviceId);

        // Avoid overwriting user-defined Content-Type,
        // such as when uploading files
        if (
          !headers.has("Content-Type") &&
          !(fetchOptions.body instanceof FormData)
        ) {
          headers.set("Content-Type", "application/json");
        }

        try {
          const res = await fetch(url, { ...fetchOptions, headers });

          // --- Success (HTTP 2xx) ---
          if (res.ok) {
            // if (res.headers.get("Content-Type") === "application/json") {
            const responseText = await res.text();
            try {
              // parse if the response is valid JSON
              return responseText ? JSON.parse(responseText) : {};
            } catch (e) {
              // Return text directly if not a json (empty or pure text)
              return responseText;
            }
            // } else {
            //   return res;
            // }
          }

          // --- Refreshing Access Token (HTTP 401/403) ---
          if (res.status === 401) {
            console.warn(
              `[AuthFetch] Attempt ${attempt}: Recieved ${res.status} error, trying to refresh Access Token...`
            );

            // If this is the last attempt,
            // there is no need to refresh again, just throw an error
            if (attempt === maxAttempts) {
              lastError = new HttpError(
                "Authentication failed and the retry limit has been reached",
                res.status,
                await res.json().catch(() => null)
              );
              break;
            }

            // Refresh logic
            try {
              const newToken = await refreshAccessToken();
              tokenToUse = newToken; // Use the newly obtained token for the next retry
              console.log(
                `[AuthFetch] Token refresh succeeded, ${
                  attempt + 1
                }th attempt will be made.`
              );
              continue; // Immediately enter the next loop to retry the request
            } catch (refreshError) {
              // If refreshAccessToken itself fails,
              // it means the refresh token may also have expired.
              console.error(
                "[AuthFetch] Failed to refresh Access Token, re-login is requeired.",
                refreshError
              );
              throw new Error("Your login has expired, please log in again.");
            }
          }

          // --- Other error (Not 2xx, not 401) ---
          const errorData = await res.json().catch(() => null); // Try parsing the error response body
          throw new HttpError(
            `API Request Failed, status: ${res.status}`,
            res.status,
            errorData
          );
        } catch (error) {
          lastError = error as Error;

          // This shit is based on the api shape:
          // ```
          // {
          //   "success": false,
          //   "data": null,
          //   "error": {
          //     "code": "ERROR_CODE",
          //     "message": "Error Message"
          //   }
          // }
          //```
          //
          // And the `error.data` is what the shape above (`res.json`),
          // so checking `error.data.error.code` and `error.data.error.message`
          if (
            error instanceof HttpError &&
            !!error.data.error.code &&
            !!error.data.error.code
          ) {
            return error.data;
          }

          // If we actively throw an HttpError or a critical login expiration error,
          // we throw it again and interrupt the retry process.
          if (
            error instanceof HttpError ||
            (error instanceof Error && error.message.includes("log in again."))
          ) {
            throw error;
          }

          // Other errors (such as network connectivity issues) are caught and allowed to be retried
          console.error(`[AuthFetch] Attempt ${attempt} failed:`, error);

          // If the last attempt fails, jump out of the loop
          if (attempt === maxAttempts) {
            break;
          }
        }
      }

      // If the loop is completed and still no successful return is returned,
      // the last captured error is thrown
      throw (
        lastError ||
        new Error(
          "The request failed after reaching the maximum number of retries."
        )
      );
    },
    // When accessToken or refreshAccessToken changed, re-generate the function
    [tokenRef, refreshAccessToken]
  );

  return { authedFetch };
};
