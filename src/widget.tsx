import { ReactWidget } from '@jupyterlab/apputils';
import React, { useEffect, /*useRef,*/ useState, useContext } from 'react';

import { UserContext } from './context';
import { requestAPI } from './handler';

import {
    MenuItem, InputLabel, Stack, Collapse, Paper,
    Typography, TextField,
    FormControl,
    Box,
    Button,
    Alert, AlertTitle,
    Chip,
    Backdrop
} from '@mui/material';

import CircularProgress from '@mui/material/CircularProgress';
import Select, { SelectChangeEvent } from '@mui/material/Select';


import { ThemeProvider } from "@mui/material/styles";
import webdsTheme from './webds_theme';

const I2C_ADDR_WIDTH = 150
const SPEED_WIDTH = 150
const SPEED_AUTO_SCAN = 0
const I2C_ADDR_AUTO_SCAN = 128
const SPI_MODE_AUTO_SCAN = -1


interface ConnectionSettings {
    action: string;
    value?: any;
}

const Post = async (dataToSend: ConnectionSettings): Promise<string | undefined> => {
    try {
        const reply = await requestAPI<any>('settings/connection', {
            body: JSON.stringify(dataToSend),
            method: 'POST',
        });
        console.log(reply);
        return Promise.resolve(JSON.stringify(reply));
    } catch (e) {
        console.error(
            `Error on POST ${dataToSend}.\n${e}`
        );
        return Promise.reject((e as Error).message);
    }
}

const Get = async (section: string): Promise<string | undefined> => {
    try {
        let url = 'settings/connection?query=' + section;

        const reply = await requestAPI<any>(url, {
            method: 'GET',
        });
        console.log(reply);
        return Promise.resolve(reply);
    } catch (e) {
        console.error(
            `Error on GET.\n${e}`
        );
        return Promise.reject((e as Error).message);
    }
}

function SelectSpiMode(
    props: {
        mode: string | number;
        handleChange: (e: SelectChangeEvent) => void;
    }){

    return (
        <Stack spacing={0} sx={{
            flexDirection: 'row',
            display: 'flex',
            alignItems: "center",
            p: 1
        }}>
            <Typography id="input-spi-speed" sx={{ p: 1 }}>
                SPI Mode
            </Typography>

            <Select
                id="connection-select-spi"
                value={props.mode.toString()}
                onChange={props.handleChange}
            >
                <MenuItem value={-1}>
                    <em>Auto</em>
                </MenuItem>
                {[0,1,2,3].map((value) => {
                    return (
                        <MenuItem value={value}>{value}</MenuItem>
                    );
                })}
            </Select>
        </Stack>
    );
}

function SelectAttn(
    props: {
        attn: string | number;
        handleChange: (e: SelectChangeEvent) => void;
    }) {

    return (
        <div>
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <InputLabel id="connection-select-spi-label">Attn</InputLabel>
                <Select
                    labelId="connection-select-spi-label"
                    id="connection-select-spi"
                    label="Attn"
                    value={props.attn.toString()}
                    onChange={props.handleChange}
                >
                    <MenuItem value={1}>Interrupt</MenuItem>
                    <MenuItem value={0}>Polling</MenuItem>
                </Select>
            </FormControl>
        </div>
    );
}

function SelectI2cAddr(
    props: {
        addr: number;
        error: boolean;
        handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    }) {
   
    return (
        <Stack spacing={0} sx={{
            flexDirection: 'row',
            display: 'flex',
            alignItems: "center",
            p:1
        }}>
            <Typography id="input-i2c-address" sx={{ p: 1 }}>
                Slave Address
            </Typography>

            <TextField id="filled-basic"
                value={props.addr}
                onChange={props.handleChange}
                error={props.error}
                type="number"
                size="small"
                sx={{
                    width: I2C_ADDR_WIDTH,
                }}
            />
        </Stack>
    );
}

function SelectSpiSpeed(
    props: {
        speed: number;
        error: boolean;
        handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    }) {

    return (
        <Stack spacing={0} sx={{
            flexDirection: 'row',
            display: 'flex',
            alignItems: "center",
            p: 1
        }}>
            <Typography id="input-spi-speed" sx={{ p: 1 }}>
                SPI Speed
            </Typography>

            <TextField id="filled-basic"
                value={props.speed}
                onChange={props.handleChange}
                error={props.error}
                type="number"
                size="small"
                sx={{
                    width: SPEED_WIDTH,
                }}
            />
        </Stack>
    );
}

type SeverityType = 'error' | 'info' | 'success' | 'warning';

export default function ConnectionWidget()
{
    //const context = useContext(UserContext);
    const [interfaces, setInterfaces] = React.useState([]);
    const [protocol, setProtocol] = React.useState('auto');
    const [isI2c, setI2c] = React.useState(false);
    const [isSpi, setSpi] = React.useState(false);
    const [showProtocol, setShowProtocol] = React.useState(false);

    const [mode, setMode] = React.useState<string | number>(-1);
    const [attn, setAttn] = React.useState<string | number>(0);
    const [addr, setAddr] = React.useState<number>(30);
    const [addrError, setAddrError] = React.useState(false);

    const [speed, setSpeed] = React.useState<number>(SPEED_AUTO_SCAN);
    const [speedError, setSpeedError] = useState(false);

    const [isAlert, setAlert] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<SeverityType>('info');

    const [info, setInfo] = useState<string[]>([]);
    const [load, setLoad] = React.useState(false);


    const context = useContext(UserContext);

    useEffect(() => {
        getJson();
    }, []);

    useEffect(() => {
        console.log("[interfaces]");
        console.log(context.interfaces);
        context.interfaces = interfaces;
    }, [interfaces]);

    useEffect(() => {
        console.log("[protocol]");
        if (protocol == "auto") {
            context.interfaces = interfaces;
            setAddr(I2C_ADDR_AUTO_SCAN);
            setMode(SPI_MODE_AUTO_SCAN);
            setSpeed(SPEED_AUTO_SCAN);
        }
        else {
            context.interfaces = [protocol];
        }
        console.log(context.interfaces);

        let i2c = false;
        let spi = false;

        if (protocol == "i2c") {
            i2c = true;
            spi = false;
        }
        else if (protocol == "spi") {
            i2c = false;
            spi = true;
        }
        setI2c(i2c);
        setSpi(spi);
        setShowProtocol(i2c || spi);
    }, [protocol]);

    useEffect(() => {
        console.log("[mode]");
        context.spiMode = Number(mode);
        console.log(context.spiMode);
    }, [mode]);

    useEffect(() => {
        console.log("[attn]");
        if (attn == 0)
            context.useAttn = false;
        else if (attn == 1)
            context.useAttn = true;
        console.log(context.useAttn);
    }, [attn]);

    useEffect(() => {
        console.log("[addr]");
        console.log(addr);

        if (addr > 128)
            setAddr(128);
        else if (addr < 0)
            setAddr(0);
        setAddrError(false);

        context.i2cAddr = Number(addr);
        console.log(context.i2cAddr);
    }, [addr]);

    useEffect(() => {
        console.log("[speed]");
        console.log(speed);

        if (speed == SPEED_AUTO_SCAN) {
            context.speed = null;
        }
        else {
            context.speed = speed;
        }
        setSpeedError(false);
        console.log(context.speed);
    }, [speed]);

    const getJson = async () => {
        const fetchData = async (section: string) => {
            const data = await Get(section);
            console.log('data', data);
            return data;
        };

        try {
            let data = await fetchData("default");
            let jsonDefaultString = JSON.stringify(data);
            data = await fetchData("custom");
            let jsonCustomString = JSON.stringify(data);

            let jsonDefault = JSON.parse(jsonDefaultString);

            let jinterfaces = jsonDefault['interfaces'];
            setInterfaces(jinterfaces);

            let jsonCustom = JSON.parse(jsonCustomString);
            let jsonMerge = Object.assign(jsonDefault, jsonCustom);
            console.log(jsonMerge);
            //jsonMergeRef.current = jsonMerge;

            let jprotocol = jsonMerge['interfaces'];
            let ji2cAddr = jsonMerge['i2cAddr'];
            let jspiMode = jsonMerge['spiMode'];
            let jspiSpeed = jsonMerge['speed'];
            let jattn = jsonMerge['useAttn'];

            console.log(jprotocol);
            console.log(ji2cAddr);
            console.log(jspiMode);
            console.log(jattn);

            if (jprotocol.length > 1)
                setProtocol("auto");
            else
                setProtocol(jprotocol[0]);

            setAddr(ji2cAddr);
            setMode(jspiMode);

            if (jspiSpeed == null)
                setSpeed(SPEED_AUTO_SCAN);
            else
                setSpeed(jspiSpeed);

            if (jattn)
                setAttn(1);
            else
                setAttn(0);
        }
        catch(error) {
            showError(error);
        }
    };


    const handleChange = (event: SelectChangeEvent<typeof protocol>) => {
        console.log(event.target.value);
        setProtocol(event.target.value);
    };

    const handleSpiModeChange = (event: SelectChangeEvent) => {
        setMode(event.target.value);
    };

    const handleAttnChange = (event: SelectChangeEvent) => {
        setAttn(event.target.value);
    };

    const handleI2cAddrChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAddr(Number(event.target.value));
    };

    const handleSpeedChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSpeed(Number(event.target.value));
    };

    function ResetDefault() {
        setLoad(true);
        setAlert(false);
        Post({ action: "reset" })
            .then(async result => {
                await getJson();
                setLoad(false);
            })
            .catch(error => {
                showError(error);
                setLoad(false);
            })
    }

    function showError(result: string) {
        setMessage(result);
        setSeverity('error');
        setAlert(true);
    }

    function UpdateSettings() {
        setLoad(true);
        setAlert(false);
        console.log(context);
        Post({ action: "update", value: context })
            .then(result => {
                console.log(result);

                let list: string[] = [];
                let jobj = JSON.parse(result!);

                Object.keys(jobj).forEach(key => {
                    console.log(key, jobj[key]);
                    list.push(key + " " + jobj[key].toString());
                })
                setInfo(list);
                setAlert(true);
                setSeverity('info');
                setLoad(false);
            })
            .catch(error => {
                console.log(error);
                showError(error);
                setLoad(false);
            })
    }

    return (
        <div>
            <ThemeProvider theme={webdsTheme}>
                <Collapse in={isAlert}>
                    <Alert severity={severity} onClose={() => setAlert(false)}>
                        <AlertTitle> Result </AlertTitle>
                        {  severity == 'info' &&
                            info.map((value) => {
                            return (
                                <Chip label={value} />
                            );
                            })}
                        {severity == 'error' && message }
                    </Alert>
                </Collapse>
                <Stack spacing={1} sx={{
                    flexDirection: 'column',
                    display: 'flex',
                    alignItems: "left",
                    width: 400,
                    ml: 3
                }}>
                    <div>
                        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                            <InputLabel id="connection-helper-label">Protocol</InputLabel>
                            <Select
                                labelId="connection-helper-label"
                                id="connection-helper"
                                label="Protocol"
                                onChange={handleChange}
                                value={protocol}
                            >
                                <MenuItem value={"auto"}>Auto Scan</MenuItem>
                                {interfaces.map((value) => {
                                    return (
                                        <MenuItem value={value}>{value}</MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </div>

                    <Collapse in={showProtocol}>
                        <Paper variant="outlined" square sx={{ ml: 1 }}>
                            <Stack spacing={1} sx={{
                                flexDirection: 'column',
                                display: 'flex',
                                alignItems: "left",
                                p: 2
                            }}>

                                <Collapse in={isI2c}>
                                    <SelectI2cAddr handleChange={handleI2cAddrChange} addr={addr} error={addrError} />
                                </Collapse>

                                <Collapse in={isSpi}>
                                    <Stack spacing={2} sx={{
                                        flexDirection: 'column',
                                        display: 'flex',
                                        alignItems: "left",
                                    }}>
                                        <SelectSpiMode handleChange={handleSpiModeChange} mode={mode} />
                                        <SelectSpiSpeed handleChange={handleSpeedChange} speed={speed} error={speedError} />
                                    </Stack>
                                </Collapse>
                            </Stack>
                        </Paper>
                    </Collapse>

                    <SelectAttn handleChange={handleAttnChange} attn={attn}/>

                    <Box sx={{ '& > :not(style)': { m: 1 } }}>
                        <Button color="primary" variant="contained" onClick={() => ResetDefault()}>
                            Reset Settings
                        </Button>
                        <Button color="primary" variant="contained" onClick={() => UpdateSettings()}>
                            Connect
                        </Button>
                    </Box>
                </Stack>

                <div>
                    <Backdrop
                        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                        open={load}
                    >
                        <CircularProgress color="inherit" />
                    </Backdrop>
                </div>
            </ThemeProvider>
        </div>
    );

}

/**
* A Counter Lumino Widget that wraps a CounterComponent.
*/
export class ShellWidget extends ReactWidget {
    /**
    * Constructs a new CounterWidget.
    */
    constructor() {
        super();
        this.addClass('content-widget');
        console.log("TabPanelUiWidget is created!!!");
    }

    handleChangeFile(e: React.ChangeEvent<HTMLInputElement>) {
        console.log(e.currentTarget.files);
    }

    render(): JSX.Element {
        return <ConnectionWidget/>;
    }
}
