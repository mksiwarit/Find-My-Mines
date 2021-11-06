import { atom } from "jotai";
import { Languge } from "./i18n";

export const langugeAtom = atom<Languge | undefined>(undefined);
export const bgmVolumeAtom = atom(50);
export const bgmPlaybackAtom = atom(1);