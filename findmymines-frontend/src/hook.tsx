import { useCallback, useEffect } from "react";
import useLocalStorage from "react-use-localstorage";
import { useSocket, useSocketEvent } from "socket.io-react-hook";
import { UseSocketReturnType, SocketLikeWithNamespace } from "socket.io-react-hook/lib/cjs/types";

export function useServerSocket() {
    return useSocket("192.168.193.181:9993/");
}

export function usePlayersNames(socket: SocketLikeWithNamespace) {

    const { socket: _socket, lastMessage: players, sendMessage } =
        useSocketEvent<string[] | undefined>(socket, 'playerUpdate');

    const fetchPlayers = useCallback(() => sendMessage(""), [sendMessage])

    return { socket: _socket, players, fetchPlayers }
}

export function useIsGameOn(socket: SocketLikeWithNamespace) {
    return useSocketEvent<boolean | undefined>(socket, "gameOn")
}

export function useStoredName(): [string, (name: string) => void] {
    const [name, setName] = useLocalStorage("name", "");
    const sn = (x: string) => {
        setName(x);
    };
    return [name, sn]
}

export function useSync(socket: SocketLikeWithNamespace, connected: boolean) {
    useEffect(() => {
        setTimeout(() => {
            if (connected) {
                console.log("Syncing...")
                socket.emit("sync")
            }
        }, 100)
    }, [connected]);
}