import React, { useEffect, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';
import { Board, CellType } from './Board';
import { WelcomePage } from './WelcomePage';
import { useSocket, useSocketEvent } from 'socket.io-react-hook';
import { useIsGameOn, usePlayersNames, useServerSocket, useStoredName, useSync } from './hook';
import EventLogger from './components/event-logger';
import MainMenu from './components/MainMenu';
import Game from './components/Game';
import {
  Box, Heading, Text, IconButton, useColorMode, IconButtonProps, Button, Slider, SliderTrack, SliderFilledTrack, SliderThumb, HStack, VStack, Stack, RadioGroup, Radio, Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure,
  ModalHeader,
  ModalCloseButton
} from '@chakra-ui/react';
import { SunIcon, MoonIcon, QuestionIcon } from '@chakra-ui/icons';
import { useAtom } from 'jotai';
import { bgmPlaybackAtom, bgmVolumeAtom, langugeAtom } from './state';
import { Languge, useI18n } from './i18n';

function App() {
  const { socket, connected, error } = useServerSocket();
  const { players, fetchPlayers } = usePlayersNames(socket);
  const [name] = useStoredName();
  const { lastMessage: gameOn, sendMessage: fetchGameOn } = useIsGameOn(socket);
  useSync(socket, connected);

  const [lang, setLang] = useAtom(langugeAtom);
  useEffect(() => {
    setLang(Languge.ENG)
  }, [])
  const wording = useI18n();

  const playing = useMemo(
    () => players?.includes(name), [players, name]
  )

  if (!connected || playing === undefined) {
    return <h1>{wording.connecting}</h1>
  }

  return (
    <>
      <Heading>
        {wording.title}
        <Box float="right">
          <TutorialBtn />
          <LangBtn />
          <ColorModeBtn />
          <BgmSlider />
        </Box>
      </Heading>

      {(connected && playing !== undefined) && <>
        {gameOn ?
          (playing ? <Game /> : <span>{wording.room_full}: {JSON.stringify(players)} {name}</span>) :
          <MainMenu />
        }
      </>
      }

      <Box position="fixed" bottom={0} width="100%" zIndex={1}>
        <EventLogger />
      </Box>
    </>
  );
}

function BgmSlider() {
  const [bgmVol, setBgmVol] = useAtom(bgmVolumeAtom);
  const [bgmSpeed, setBgmSpeed] = useAtom(bgmPlaybackAtom);

  return (
    <VStack>
      <RadioGroup value={bgmSpeed} onChange={x => setBgmSpeed(+x)}>
        <HStack>
          <Radio value={0.75}>
            S
          </Radio>
          <Radio value={1}>M</Radio>
          <Radio value={1.25}>F</Radio>
        </HStack>
      </RadioGroup>

      <HStack width="100%">
        <Text fontSize="lg">{bgmVol}</Text>
        <Slider aria-label="slider-ex-1" defaultValue={50} max={100} value={bgmVol} onChange={setBgmVol}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </HStack>
    </VStack>
  )
}

function TutorialBtn() {
  const wording = useI18n();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (<>
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Tutorial
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text whiteSpace="pre-line">
            {wording.tutorial_msg}
          </Text>
        </ModalBody>
      </ModalContent>
    </Modal>

    <IconButton onClick={onOpen} icon={<QuestionIcon />} aria-label="Tutorial Button"></IconButton>
  </>)
}

function LangBtn(props: Omit<IconButtonProps, "icon" | "onClick" | "aria-label">) {
  const [lang, setLang] = useAtom(langugeAtom);

  return <Button onClick={() => setLang(lang => lang === Languge.ENG ? Languge.THAI : Languge.ENG)}>{lang}</Button>;
}

function ColorModeBtn(props: Omit<IconButtonProps, "icon" | "onClick" | "aria-label">) {
  const { colorMode, toggleColorMode } = useColorMode();

  const icon = useMemo(() => (colorMode === "light") ? <MoonIcon /> : <SunIcon />, [colorMode]);
  return <IconButton {...props} icon={icon} onClick={toggleColorMode} aria-label="Toggle Color Mode" />;
}

export default App;
