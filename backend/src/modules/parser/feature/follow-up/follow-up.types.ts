/**
 * Optional parse context that allows question templtaes to use merchant
 * name or category for more natural phrasing.
 * All fields are optional — the generator must work without any context.
 */

import type {
  Category,
  MissingField,
} from "../../constants/parser.constants.js";

export interface FollowUpContext {
  merchantName?: string | null;
  category?: Category;
}

/**
 * Input to the follow-up generator.
 * missingFields comes directly from detectMissingFields().
 * context is whatever the parser already extracted — pass what you have.
 */

export interface GeneratorFollowUpInput {
  missingFields: MissingField[];
  context?: FollowUpContext;
}
