import { useAtom } from "jotai";
import { tutorialMsgEng, tutorialMsgThai } from "./const";
import { langugeAtom } from "./state";

export enum Languge {
    ENG = "ENG",
    THAI = "THAI",
}

type Word = { [key in keyof typeof Languge]: string }

function asWording<T>(t: { [key in keyof T]: Word }) {
    return t;
}

export const wording = asWording({
    title: {
        ENG: "Find My Mines",
        THAI: "เกมค้นหาระเบิดของฉัน"
    },
    connecting: {
        ENG: "Connecting",
        THAI: "กำลังเชื่อมต่อ"
    },
    room_full: {
        ENG: "The room is full",
        THAI: "ห้องเติมแล้ว"
    },
    ended: {
        ENG: "The game has ended",
        THAI: "เกมจบแล้ว"
    },
    click_square: {
        ENG: "Please click on the black square",
        THAI: "คลิกที่สี่เหลื่ยมสีดำ"
    },
    wait: {
        ENG: "Please wait",
        THAI: "กรุณารอ"
    },
    win: {
        ENG: "You win!",
        THAI: "คุณชนะ!"
    },
    lose: {
        ENG: "You lose!",
        THAI: "คุณแพ้!"
    },
    your_turn: {
        ENG: "Your turn: ",
        THAI: "ตาคุณ: "
    },
    others_turn: {
        ENG: "Others turn: ",
        THAI: "ตาอีกฝ่าย: "
    },
    score: {
        ENG: "Score",
        THAI: "คะแนน"
    },
    tutorial_msg: {
        ENG: tutorialMsgEng,
        THAI: tutorialMsgThai
    }
});

function makeLangDict<T>(ent: [T, Word][], lang: Languge) {
    return Object.fromEntries(ent.map(([k, v]) => [k, v[lang]]));
}

function makei18nDict() {
    const ent = Object.entries(wording);

    return {
        ENG: makeLangDict(ent, Languge.ENG),
        THAI: makeLangDict(ent, Languge.THAI)
    }
}

export const i18nMapping = makei18nDict();
export function useI18n(): { [key in keyof typeof wording]: string } {
    const [lang] = useAtom(langugeAtom);

    switch (lang ?? Languge.ENG) {
        case Languge.ENG:
            return i18nMapping.ENG;
        case Languge.THAI:
            return i18nMapping.THAI;
        default:
            throw new Error("Unreachable");
    }
}