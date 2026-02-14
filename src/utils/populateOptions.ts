import { USER_SELECT_FIELDS, MESSAGE_SELECT_FIELDS, POPULATE_PATHS } from "../config/constants.js";

export const userFields = USER_SELECT_FIELDS;

export const messagePopulateOptions = [
  { path: POPULATE_PATHS.SENDER, select: userFields },
  { path: POPULATE_PATHS.DELIVERED_TO, select: userFields },
  { path: POPULATE_PATHS.SEEN_BY, select: userFields },
  { 
    path: POPULATE_PATHS.REPLY_TO, 
    select: MESSAGE_SELECT_FIELDS,
    populate: { path: POPULATE_PATHS.SENDER, select: userFields }
  },
];

export const conversationPopulateOptions = [
  { path: POPULATE_PATHS.PARTICIPANTS, select: userFields },
  { path: POPULATE_PATHS.ADMINS, select: userFields },
  {
    path: POPULATE_PATHS.LAST_MESSAGE,
    populate: messagePopulateOptions,
  },
];