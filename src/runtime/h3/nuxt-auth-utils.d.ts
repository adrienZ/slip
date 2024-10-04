import type { H3Event, SessionConfig } from "h3";
import type {
  SlipAuthPublicUser,
  SlipAuthPublicSession,
} from "../types";

declare global {

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface SecureSessionData {
  }

  export interface UserSession extends SlipAuthPublicSession {
  /**
   * User session data, available on client and server
   */
    user?: SlipAuthPublicUser
    /**
     * Private session data, only available on server/ code
     */
    secure?: SecureSessionData
    /**
     * Extra session data, available on client and server
     */
    [key: string]: unknown
  }

  export interface UserSessionRequired extends UserSession {
    user: SlipAuthPublicUser
  }

  export interface SessionHooks {
  /**
   * Called when fetching the session from the API
   * - Add extra properties to the session
   * - Throw an error if the session could not be verified (with a database for example)
   */
    fetch: (session: UserSessionRequired, event: H3Event) => void | Promise<void>
    /**
     * Called before clearing the session
     */
    clear: (session: UserSession, event: H3Event) => void | Promise<void>
  }
  export declare const sessionHooks: import("hookable").Hookable<SessionHooks, import("hookable").HookKeys<SessionHooks>>;
  /**
   * Get the user session from the current request
   * @param event The Request (h3) event
   * @returns The user session
   */
  export declare function getUserSession(event: H3Event): Promise<UserSession>;
  /**
   * Set a user session
   * @param event The Request (h3) event
   * @param data User session data, please only store public information since it can be decoded with API calls
   * @see https://github.com/atinux/nuxt-auth-utils
   */
  export function setUserSession(event: H3Event, data: UserSession, config?: Partial<SessionConfig>): Promise<UserSession>;
  /**
   * Replace a user session
   * @param event The Request (h3) event
   * @param data User session data, please only store public information since it can be decoded with API calls
   */
  export declare function replaceUserSession(event: H3Event, data: UserSession, config?: Partial<SessionConfig>): Promise<UserSession>;
  /**
   * Clear the user session and removing the session cookie
   * @param event The Request (h3) event
   * @returns true if the session was cleared
   */
  export declare function clearUserSession(event: H3Event): Promise<boolean>;
  /**
   * Require a user session, throw a 401 error if the user is not logged in
   * @param event
   * @param opts Options to customize the error message and status code
   * @param opts.statusCode The status code to use for the error (defaults to 401)
   * @param opts.message The message to use for the error (defaults to Unauthorized)
   * @see https://github.com/atinux/nuxt-auth-utils
   */
  export declare function requireUserSession(event: H3Event, opts?: {
    statusCode?: number
    message?: string
  }): Promise<UserSessionRequired>;
}
