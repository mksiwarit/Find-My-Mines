import { Input } from "@chakra-ui/input";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/layout";
import { CircularProgress } from "@chakra-ui/progress";
import { FormEventHandler, useEffect, useState } from "react";
import useLocalStorage from "react-use-localstorage";
import { useSocketEvent } from "socket.io-react-hook";
import { useIsGameOn, usePlayersNames, useServerSocket, useStoredName } from "../hook";

function JoinRoomForm() {
    const { socket, connected, error } = useServerSocket();
    const { sendMessage: joinRoom } = useSocketEvent(socket, 'joinRoom');
    const [_name, _setName] = useState<string>("");
    const [name, setName] = useStoredName();
    const handleSubmit: FormEventHandler = (ev) => {
        if (_name === undefined) {
            alert("Please input a valid name!")
            return;
        }
        setName(_name);
        joinRoom(_name);
        ev.preventDefault();
    }
    return (
        <form onSubmit={handleSubmit}>
            <HStack>
                <Input placeholder="Name" type="text" value={_name} onChange={ev => _setName(ev.target.value)} />
                <Input type="submit" />
            </HStack>
        </form>
    );
}

function MainMenu() {
    const { socket, connected, error } = useServerSocket();
    const { players } = usePlayersNames(socket);
    const [name, setName] = useStoredName();
    useEffect(() => {
        if (players === undefined || !name) {
            return;
        }
        if (!players.includes(name)) {
            setName("")
        }
    },
        [players]
    );
    return <div>
        <Text>Current Players: {JSON.stringify(players)}</Text>
        {name ? (
            <Box textAlign="center">
                <Heading>Welcome, {name}</Heading>
                <HStack justifyContent="center">
                    <Text>Please wait for another player...</Text>
                    <CircularProgress isIndeterminate />
                </HStack>
            </Box>
        ) : <JoinRoomForm />}
    </div>
}

export default MainMenu;