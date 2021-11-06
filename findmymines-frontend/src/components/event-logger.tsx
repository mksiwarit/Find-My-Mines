import { useEffect, useState } from "react";
import { useServerSocket } from "../hook";
import { useImmer } from "use-immer"
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel } from "@chakra-ui/accordion";
import { Box, List, ListItem, OrderedList } from "@chakra-ui/layout";

function updateLogs(draft: string[], ev: any, msg: any) {
    draft.push(`[${(new Date()).toLocaleTimeString()}] | [${ev}]: ${JSON.stringify(msg)}`);
}

function EventLogger() {
    const { socket, connected } = useServerSocket();
    const [logs, setLogs] = useImmer<string[]>([]);

    useEffect(() => {
        if (connected) {
            socket.onAny((ev, msg) => setLogs((logs) => updateLogs(logs, ev, msg)))
        }
    }, [socket, connected])

    return <Accordion allowToggle>
        <AccordionItem>
            <AccordionButton>
                Event Log
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel maxHeight="30vh" overflow="scroll">
                <List>
                    {
                        logs.map((msg, i) => <ListItem>{msg}</ListItem>)
                    }
                </List>
            </AccordionPanel>
        </AccordionItem>
    </Accordion>
}

export default EventLogger;