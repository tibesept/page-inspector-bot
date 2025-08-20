import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { Context, SessionFlavor } from "grammy";

export enum ELanguages {
    ru = "RU",
    en = "EN",
}

export interface ISessionData {
    language: ELanguages;
}

export type TMyContext = ConversationFlavor<
    Context & SessionFlavor<ISessionData>
>;
export type TMyConversation = Conversation<TMyContext>;
