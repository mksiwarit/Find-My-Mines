import { Box, Center, Heading, Text, VStack } from "@chakra-ui/layout";
import { useEffect, useMemo, useState } from "react";
import { useSocketEvent } from "socket.io-react-hook";
import { Board, CellType } from "../Board";
import { usePlayersNames, useServerSocket, useStoredName, useSync } from "../hook";
import { useSound } from 'use-sound'
import { Button } from "@chakra-ui/button";
import { useI18n, wording } from "../i18n";
import { useToast } from "@chakra-ui/toast";
import { useAtom } from "jotai";
import { bgmPlaybackAtom, bgmVolumeAtom } from "../state";

type OpenSet = [[number, number], number][];

function make_table(open_index: OpenSet, golden_index: [number, number][], board_size: number) {
    let table = Array(board_size).fill(0).map(() => Array(board_size).fill(CellType.UNOPEN))

    for (let [[x_pos, y_pos], has_bomb] of open_index) {
        table[y_pos][x_pos] = has_bomb ? CellType.BOMB : CellType.OPEN;
    }

    for (let [x_pos, y_pos] of golden_index) {
        if (table[y_pos][x_pos] === CellType.BOMB) {
            table[y_pos][x_pos] = CellType.GOLDEN_BOMB;
        }
    }

    return table
}

function Game() {
    // Setup Socket stuff
    const { socket, connected, error } = useServerSocket();
    const { players } = usePlayersNames(socket);
    const [name] = useStoredName();

    const { lastMessage: openset } = useSocketEvent<OpenSet | undefined>(socket, "openUpdate")
    const { lastMessage: goldenset } = useSocketEvent<[number, number][] | undefined>(socket, "goldenUpdate")
    const { lastMessage: currentPlayer } = useSocketEvent<number>(socket, "currentPlayer")
    const { lastMessage: scores } = useSocketEvent<number[] | undefined>(socket, "scores")
    const { lastMessage: timer } = useSocketEvent<number | undefined>(socket, "timer")
    const { lastMessage: boardSize } = useSocketEvent<number | undefined>(socket, "boardSize")
    const { lastMessage: gameEnded } = useSocketEvent<boolean | undefined>(socket, "gameEnd")
    const { sendMessage: checkMines } = useSocketEvent<number>(socket, "checkMines")

    useSync(socket, connected);

    // Setup state & utils hook
    const [lastClick, setLastClick] = useState<[number, number]>();
    const wording = useI18n();
    const toast = useToast();

    // Calculate things
    const myTurn = useMemo(() => players && players[currentPlayer] == name && !gameEnded, [players, currentPlayer, name, gameEnded])
    const table = useMemo(() => (openset !== undefined && goldenset !== undefined && boardSize !== undefined) ? make_table(openset, goldenset, boardSize) : undefined, [openset, goldenset, boardSize])
    const playerIndex = players?.indexOf(name);

    // Loading Sound Effect
    const [playBuzzer] = useSound("./Buzzer1.ogg");
    const [playChicken] = useSound("./Chicken.ogg");
    const [playCoin] = useSound("./Coin.ogg");
    const [playRecovery] = useSound("./Recovery.ogg");

    // Handling when player click cell
    const cellClick = (j: number, i: number) => {
        if (gameEnded) {
            ((Math.random() > 0.1) ? playChicken : playBuzzer)()
            toast({
                title: "Invalid",
                description: "Game Ended",
                status: "error",
                isClosable: true
            });
            return;
        }

        if (!myTurn) {
            ((Math.random() < 0.1) ? playChicken : playBuzzer)()
            toast({
                title: "Invalid",
                description: "Not your turn",
                status: "error",
                isClosable: true
            });
            return;
        }

        if (table === undefined) {
            toast({
                title: "Invalid",
                description: "Table not loaded",
                status: "error",
                isClosable: true
            });
            return;
        }

        if (table[j][i] !== CellType.UNOPEN) {
            toast({
                title: "Invalid",
                description: "Cell is already opened",
                status: "error",
                isClosable: true
            });
            return;
        }


        checkMines([i, j]);
        setLastClick([i, j]);
    }

    useEffect(() => {
        if (lastClick === undefined || openset === undefined || (myTurn !== true)) {
            return;
        }

        const res = openset.find(([pos]) => pos[0] === lastClick[0] && pos[1] === lastClick[1]);
        if (res === undefined) {
            console.error("Last click on not opened cell");
        }
        else {
            const [pos, has_bomb] = res;
            (has_bomb ? playRecovery : playCoin)();
        }

    }, [openset])


    // Play BGM
    const [bgmVol] = useAtom(bgmVolumeAtom);
    const [bgmSpeed] = useAtom(bgmPlaybackAtom);
    const [play, { stop }] = useSound("./Battle8.ogg", { volume: bgmVol / 100, playbackRate: bgmSpeed });
    useEffect(() => {
        play();
        return () => stop()
    }, [play]);

    return <>
        {(table !== undefined && (playerIndex !== undefined) && scores) && players && wording &&
            <VStack textAlign="center" width="100%">
                {gameEnded ?
                    <>
                        <Heading>{(wording.ended)}</Heading>
                        <Heading>{scores[playerIndex] > scores[1 - playerIndex] ? wording.win : wording.lose}</Heading>
                    </> :
                    <>
                        <Heading>{myTurn ? `${wording.your_turn} ${players[playerIndex]}` : `${wording.others_turn} ${players[1 - playerIndex]}`}</Heading>
                        <Text>{myTurn ? wording.click_square : wording.wait}</Text>
                    </>
                }

                <Text>{wording.score}: {players[playerIndex]} <b>{scores[playerIndex]}</b> vs {players[1 - playerIndex]} <b>{scores[1 - playerIndex]}</b></Text>
                <Box filter={myTurn || gameEnded ? undefined : "blur(2px)"}>
                    <Board table={table} cellClick={cellClick}></Board>
                </Box>
                {gameEnded || <Text fontSize="xl">{timer}</Text>}
            </VStack>
        }
    </>
}

export default Game;