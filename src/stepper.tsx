import React, { useState, useEffect } from "react";

import {
    Button,
    Stack,
    Chip,
    TextField,
    Link,
    Typography,
    Paper,
    Box,
    Divider
} from "@mui/material";
import { requestAPI } from "./handler";

import StarRateIcon from "@mui/icons-material/StarRate";
import WifiSettings from "./wifi";

const TEXT_WIDTH_IP = 350;
const TEXT_WIDTH_CONNECT_TITLE = 100;
const TEXT_WIDTH_CONNECT = 200;
const STEP_PAPER_WIDTH = 940;
const STEP_PAPER_HEIGHT = 380;

export default function SwipeableTextMobileStepper(props: any) {
    const [ipAddress, setIpAddress] = useState("");
    const [connectPort, setConnectPort] = useState("");
    const [pairPort, setPairPort] = useState("");
    const [pairingCode, setPairingCode] = useState("");
    const [applyResult, setApplyResult] = useState("");
    const [connected, setConnected] = useState(false);

    ///const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const ImageArea = (props) => (
        <Stack direction="row" justifyContent="flex-start" alignItems="center">
            <div style={{ border: "1px solid" }}>{props.children}</div>
        </Stack>
    );

    useEffect(() => {
        SendCheckConnection().then((ret) => {
            setConnected(ret);
        });
    }, []);

    const SendCheckConnection = async (): Promise<boolean> => {
        let url = "settings/adb";

        const reply = await requestAPI<any>(url, {
            method: "GET"
        });
        //console.log(reply);
        if (reply["connect"] === "Wi-Fi") {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    };

    const SendDisconnect = async (): Promise<string> => {
        let dataToSend = {
            action: "disconnect"
        };

        const reply = await requestAPI<any>("settings/adb", {
            body: JSON.stringify(dataToSend),
            method: "POST"
        });
        //console.log(reply);
        return Promise.resolve(JSON.stringify(reply));
    };

    const SendPairConnect = async (): Promise<string> => {
        let dataToSend = {
            action: "connect",
            ip: ipAddress,
            pairPort: pairPort,
            connectPort: connectPort,
            pairingCode: pairingCode
        };

        const reply = await requestAPI<any>("settings/adb", {
            body: JSON.stringify(dataToSend),
            method: "POST"
        });
        //console.log(reply);
        return Promise.resolve(JSON.stringify(reply));
    };

    const onClickEvent = (event: any) => {
        if (connected) {
            onClickAdbDisconnect(event);
        } else {
            onClickApplyWifiADB(event);
        }
    };

    const onClickApplyWifiADB = (event: any) => {
        setApplyResult("");
        SendPairConnect()
            .then((ret) => {
                let dict = JSON.parse(ret!);
                let message = "";
                if (dict["pair"] === true) message = message + " Pair Pass. ";
                if (dict["connect"] === true) message = message + " Connect Pass. ";
                else message = "Connect failed.";
                setApplyResult(message);
                return SendCheckConnection();
            })
            .then((ret) => {
                setConnected(ret);
            })
            .catch((e) => {
                setApplyResult(e);
                console.log(e);
            });
    };

    const onClickAdbDisconnect = (event: any) => {
        setApplyResult("");
        SendDisconnect()
            .then((ret) => {
                return SendCheckConnection();
            })
            .then((ret) => {
                setConnected(ret);
            })
            .catch((e) => {
                setApplyResult(e);
                console.log(e);
            });
    };

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        switch (event.target.id) {
            case "ipAddress":
                setIpAddress(event.target.value);
                break;
            case "connectPort":
                setConnectPort(event.target.value);
                break;
            case "pairPort":
                setPairPort(event.target.value);
                break;
            case "pairingCode":
                setPairingCode(event.target.value);
                break;
            default:
                break;
        }
    };

    function showConnectionSetting(title: string, id: string, value: string) {
        return (
            <Stack direction="row" spacing={1} alignItems="flex-end">
                <Typography sx={{ width: TEXT_WIDTH_CONNECT_TITLE }}>
                    {title}
                </Typography>
                <TextField
                    size="small"
                    id={id}
                    variant="standard"
                    value={value}
                    onChange={handleTextChange}
                    sx={{ width: TEXT_WIDTH_CONNECT }}
                    error={value === ""}
                    disabled={connected}
                />
            </Stack>
        );
    }

    function showNoteMessage(m: string) {
        return (
            <Stack direction="row" alignItems="center" sx={{ bgcolor: "#e6f7ff" }}>
                <StarRateIcon sx={{ color: "#005780", width: 20, height: 20, ml: 2 }} />
                <Typography
                    variant="button"
                    display="block"
                    sx={{ fontSize: 14, color: "#005780", m: 1 }}
                    align="center"
                >
                    Note:
        </Typography>
                <Typography
                    gutterBottom
                    sx={{ m: 0, fontSize: 13, color: "#005780" }}
                    align="center"
                >
                    {m} {""}
                    <Link
                        target="_blank"
                        href="https://developer.android.com/studio/command-line/adb?gclid=Cj0KCQjwgO2XBhCaARIsANrW2X1W1EUq68VwHTP1AFEtJRQ--chgT5Oy9ewXDx7T82dvXmUsTPZs_3MaArvIEALw_wcB&gclsrc=aw.ds#connect-to-a-device-over-wi-fi-android-11+"
                        rel="noreferrer"
                    >
                        Link
          </Link>
                </Typography>
            </Stack>
        );
    }

    const steps = [
        {
            label: "Enable Wireless Debugging",
            content: (
                <Stack spacing={2}>
                    {showNoteMessage(
                        "The instructions below only apply to devices running Android 11"
                    )}
                    <div>
                        <Typography sx={{ fontSize: 12 }}>
                            Head to Developer Options from Settings -{`>`} System -{`>`}{" "}
              Advanced or at the bottom of the Settings app.
            </Typography>
                        <Typography sx={{ fontSize: 12 }}>
                            Tap the "Wireless debugging" option
            </Typography>
                    </div>
                    <ImageArea>
                        <div className="jp-enableWifiDebugImage"></div>
                    </ImageArea>
                </Stack>
            )
        },
        {
            label: "Enable Wireless Debugging",
            content: (
                <Stack spacing={2}>
                    <div>
                        <Typography sx={{ fontSize: 12 }}>
                            Check "Always allow on this network"
            </Typography>
                        <Typography sx={{ fontSize: 12 }}>Then press "Allow"</Typography>
                    </div>
                    <ImageArea>
                        <div className="jp-allowWirelessDebugImage"></div>
                    </ImageArea>
                </Stack>
            )
        },
        {
            label: "Get Wi-Fi Device IP address and port",
            content: (
                <Stack spacing={2} direction="row">
                    <Stack
                        spacing={2}
                        direction="column"
                        sx={{
                            width: 400,
                            pr: 2
                        }}
                    >
                        <div>
                            <Typography sx={{ fontSize: 12 }}>
                                On your device, tap on "Wireless debugging"
              </Typography>
                            <Typography sx={{ fontSize: 12 }}>
                                The IP address and port number are required for use in the next
                                steps
              </Typography>
                        </div>
                        <Paper
                            sx={{
                                width: 230,
                                height: 60,
                                p: 2
                            }}
                        >
                            <Typography sx={{ fontSize: 12 }}>IP address & Port</Typography>
                            <Stack direction="row" alignItems="flex-end" spacing={2}>
                                <TextField
                                    size="small"
                                    id="ipAddress"
                                    placeholder="IP address"
                                    variant="standard"
                                    value={ipAddress}
                                    onChange={handleTextChange}
                                    sx={{ width: TEXT_WIDTH_IP }}
                                    error={ipAddress === ""}
                                    autoFocus
                                />
                                <Typography sx={{ fontSize: 20 }}>:</Typography>
                                <TextField
                                    size="small"
                                    id="connectPort"
                                    placeholder="Port"
                                    variant="standard"
                                    value={connectPort}
                                    onChange={handleTextChange}
                                    error={connectPort === ""}
                                />
                            </Stack>
                        </Paper>
                    </Stack>
                    <Divider orientation="vertical" />
                    <ImageArea>
                        <div className="jp-getIpPortImage"></div>
                    </ImageArea>
                </Stack>
            )
        },
        {
            label: "Get Wi-Fi Device Pairing Code",
            content: (
                <Stack spacing={2}>
                    <div>
                        <Typography sx={{ fontSize: 12 }}>
                            From the main wireless debugging screen, tap "Pair device with
                            pairing code"
            </Typography>
                    </div>
                    <ImageArea>
                        <div className="jp-pairDeviceImage"></div>
                    </ImageArea>
                </Stack>
            )
        },
        {
            label: "Get Wi-Fi Device Pairing Code",
            content: (
                <Stack spacing={2} direction="row">
                    <Stack
                        spacing={2}
                        direction="column"
                        sx={{
                            width: 400,
                            pr: 2
                        }}
                    >
                        <Typography
                            sx={{ fontSize: 12 }}
                            style={{ display: "inline-block", whiteSpace: "pre-line" }}
                        >
                            The pairing code, IP address, and port number are required for use
                            in the next steps
            </Typography>
                        <Paper
                            sx={{
                                width: 230,
                                height: 200,
                                p: 2
                            }}
                        >
                            <Typography display="block" gutterBottom sx={{ mb: 2 }}>
                                Pair with device
              </Typography>
                            <Typography sx={{ fontSize: 12 }}>Wi-Fi paring code</Typography>
                            <TextField
                                size="small"
                                id="pairingCode"
                                placeholder="Pairing code"
                                variant="standard"
                                sx={{ mb: 2 }}
                                value={pairingCode}
                                onChange={handleTextChange}
                                error={pairingCode === ""}
                                autoFocus
                            />
                            <Typography sx={{ fontSize: 12 }}>IP address & Port</Typography>
                            <Stack direction="row" alignItems="flex-end" spacing={2}>
                                <TextField
                                    size="small"
                                    id="ipAddress"
                                    placeholder="IP address"
                                    variant="standard"
                                    value={ipAddress}
                                    onChange={handleTextChange}
                                    sx={{ width: TEXT_WIDTH_IP }}
                                    error={ipAddress === ""}
                                />
                                <Typography sx={{ fontSize: 20 }}>:</Typography>
                                <TextField
                                    size="small"
                                    id="pairPort"
                                    placeholder="Port"
                                    variant="standard"
                                    value={pairPort}
                                    onChange={handleTextChange}
                                    error={pairPort === ""}
                                />
                            </Stack>
                        </Paper>
                    </Stack>
                    <Divider orientation="vertical" />
                    <ImageArea>
                        <div className="jp-pairingCodeImage"></div>
                    </ImageArea>
                </Stack>
            )
        },
        {
            label: "PinormOS Wifi Network",
            content: (
                <Stack spacing={2}>
                    <div>
                        <Typography sx={{ fontSize: 12 }}>
                            Check device and PinormOS are on the same Wi-Fi network
            </Typography>
                    </div>
                    <WifiSettings />
                </Stack>
            )
        },
        {
            label: "Run the wireless ADB pairing & debugging Command",
            content: (
                <Stack spacing={4}>
                    <div>
                        <Typography sx={{ fontSize: 12, height: 20 }}>
                            The pairing code, IP address, and port numbers
            </Typography>
                        <Typography sx={{ fontSize: 12, height: 20 }}>
                            {applyResult}
                        </Typography>
                    </div>

                    <Paper elevation={0} square sx={{ bdcolor: "transparent" }}>
                        <Stack spacing={1}>
                            {showConnectionSetting(
                                "Pairing Code",
                                "pairingCode",
                                pairingCode
                            )}
                            {showConnectionSetting("IP Address", "ipAddress", ipAddress)}
                            {showConnectionSetting(
                                "Connect Port",
                                "connectPort",
                                connectPort
                            )}
                            {showConnectionSetting("Pair Port", "pairPort", pairPort)}
                        </Stack>
                    </Paper>

                    <Button
                        onClick={onClickEvent}
                        variant="outlined"
                        disabled={
                            (pairPort === "" ||
                                ipAddress === "" ||
                                pairingCode === "" ||
                                connectPort === "") &&
                            !connected
                        }
                    >
                        {connected ? "Disconnect" : "Connect"}
                    </Button>
                </Stack>
            )
        }
    ];

    return (
        <Box sx={{ minWidth: 500, flexGrow: 1 }}>
            <Paper
                square
                elevation={0}
                sx={{
                    display: "flex",
                    height: STEP_PAPER_HEIGHT,
                    width: STEP_PAPER_WIDTH,
                    pl: 2,
                    bgcolor: "background.default",
                    overflow: "auto"
                }}
            >
                <Stack direction="column" alignItems="flex-start" spacing={1}>
                    <Stack
                        direction="row"
                        justifyContent="center"
                        alignItems="center"
                        spacing={1}
                        sx={{ mt: 2 }}
                    >
                        <Chip variant="outlined" label={`Step ${props.activeStep + 1}`} />
                        <Typography>{steps[props.activeStep].label}</Typography>
                    </Stack>
                    <Stack sx={{ pl: 9 }}>{steps[props.activeStep].content}</Stack>
                </Stack>
            </Paper>
        </Box>
    );
}
