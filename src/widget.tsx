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
import { WebDSService } from '@webds/service';

const I2C_ADDR_WIDTH = 100
const SPEED_WIDTH = 100
const POWER_WIDTH = 100
const LEVEL1_SELECT_WIDTH = 120
const TITLE_WIDTH = 120
const SPEED_AUTO_SCAN = null
const I2C_ADDR_AUTO_SCAN = '128'
const SPI_MODE_AUTO_SCAN = -1
const DEFAULT_POWER_VDD = '1800'
const DEFAULT_POWER_VDDTX = '1200'
const DEFAULT_POWER_VLED = '3300'
const DEFAULT_POWER_VPU = '1800'
const DEFAULT_SPEED_I2C = '1000'
const DEFAULT_SPEED_SPI = '15000'

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
            <Typography id="input-spi-speed" sx={{ p: 1, minWidth: TITLE_WIDTH }}>
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
            <FormControl variant="standard" sx={{ m: 1, width: LEVEL1_SELECT_WIDTH }}>
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
        addr: string;
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
            <Typography id="input-i2c-address" sx={{ p: 1, minWidth: TITLE_WIDTH }}>
                Slave Address
            </Typography>

            <TextField id="filled-basic"
                value={props.addr}
                onChange={props.handleChange}
                error={props.error}
                size="small"
                sx={{
                    width: I2C_ADDR_WIDTH,
                }}
            />
        </Stack>
    );
}

function SelectSpeed(
    props: {
        name: string;
        unit: string;
        speed: string;
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
            <Typography sx={{ p: 1, minWidth: TITLE_WIDTH }}>
                { props.name }
            </Typography>

            <TextField id="filled-basic"
                value={props.speed}
                onChange={props.handleChange}
                error={props.error}
                size="small"
                sx={{
                    width: SPEED_WIDTH,
                }}
            />

            <Typography sx={{ p: 1 }}>
                { props.unit }
            </Typography>
        </Stack>
    );
}


function SelectPower(
    props: {
        name: string;
        power: string;
        error?: boolean;
        handleChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, source: string) => void;
    }) {

    return (
        <Stack spacing={0} sx={{
            flexDirection: 'row',
            display: 'flex',
            alignItems: "center",
        }}>
            <Typography sx={{ p: 1, width: 55 }}>
                {props.name}
            </Typography>

            <TextField id="filled-basic"
                value={props.power}
                onChange={(e) => props.handleChange(e, props.name)}
                error={props.error}
                size="small"
                sx={{
                    width: POWER_WIDTH,
                }}
            />

            <Typography sx={{ p: 1 }}>
                mv
            </Typography>
        </Stack>
    );
}


type SeverityType = 'error' | 'info' | 'success' | 'warning';

export default function ConnectionWidget(props: any)
{
    //const context = useContext(UserContext);
    const [interfaces, setInterfaces] = React.useState([]);
    const [defaultJson, setDefaultJson] = React.useState('');
    const [protocol, setProtocol] = React.useState('auto');
    const [isI2c, setI2c] = React.useState(false);
    const [isSpi, setSpi] = React.useState(false);
    const [showProtocol, setShowProtocol] = React.useState(false);

    const [mode, setMode] = React.useState<string | number>(-1);
    const [attn, setAttn] = React.useState<string | number>(0);
    const [addr, setAddr] = React.useState<string>('30');

    const [power, setPower] = React.useState('Default');
    const [vdd, setVdd] = React.useState<string>(DEFAULT_POWER_VDD);
    const [vddtx, setVddtx] = React.useState<string>(DEFAULT_POWER_VDDTX);
    const [vled, setVled] = React.useState<string>(DEFAULT_POWER_VLED);
    const [vpu, setVpu] = React.useState<string>(DEFAULT_POWER_VPU);

    const [vddError, setVddError] = useState(false);
    const [vddtxError, setVddtxError] = useState(false);
    const [vledError, setVledError] = useState(false);
    const [vpuError, setVpuError] = useState(false);

    const [addrError, setAddrError] = React.useState(false);

    const [speedI2c, setSpeedI2c] = React.useState<string>(DEFAULT_SPEED_I2C);
    const [speedSpi, setSpeedSpi] = React.useState<string>(DEFAULT_SPEED_SPI);
    const [speedI2cError, setSpeedI2cError] = useState(false);
    const [speedSpiError, setSpeedSpiError] = useState(false);

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
        //console.log("[interfaces]");
        context.interfaces = interfaces;
    }, [interfaces]);

    useEffect(() => {
        //console.log("[protocol]");
        if (protocol == "auto") {
            context.interfaces = interfaces;
            setAddr(I2C_ADDR_AUTO_SCAN);
            setMode(SPI_MODE_AUTO_SCAN);
            setSpeedI2c(DEFAULT_SPEED_I2C);
            setSpeedSpi(DEFAULT_SPEED_SPI);
        }
        else {
            context.interfaces = [protocol];
        }
        //console.log(context.interfaces);

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
        //console.log("[mode]");
        context.spiMode = Number(mode);
        //console.log(context.spiMode);
    }, [mode]);

    useEffect(() => {
        //console.log("[attn]");
        if (attn == 0)
            context.useAttn = false;
        else if (attn == 1)
            context.useAttn = true;
        //console.log(context.useAttn);
    }, [attn]);

    useEffect(() => {
        console.log("[addr]");
        console.log(addr);

        let num = parseInt(addr);

        if (isNaN(num) || isNaN(Number(addr))) {
            setAddrError(true);
        }
        else {
            if (num > 128)
                setAddr('128');
            else if (num < 0)
                setAddr('0');
            context.i2cAddr = num;
            //console.log(context.i2cAddr);
            setAddrError(false);
        }
    }, [addr]);

    useEffect(() => {
        console.log("[speed i2c]");

        let num = parseInt(speedI2c);

        if (isNaN(num) || isNaN(Number(speedI2c))) {
            setSpeedI2cError(true);
        }
        else {
            setSpeedI2cError(false);
            //console.log(context.speed);
        }
    }, [speedI2c]);

    useEffect(() => {
        console.log("[speed spi]");

        let num = parseInt(speedSpi);

        if (isNaN(num) || isNaN(Number(speedSpi))) {
            setSpeedSpiError(true);
        }
        else {
            setSpeedSpiError(false);
            //console.log(context.speed);
        }
    }, [speedSpi]);

    useEffect(() => {
        let num = parseInt(vdd);

        if (isNaN(num) || isNaN(Number(vdd))) {
            setVddError(true);
        }
        else {
            if (num > 4000)
                setVdd('4000');
            else if (num < 0)
                setVdd('0');
            context.vdd = num;
            //console.log(context.vdd);
            setVddError(false);
        }
    }, [vdd]);

    useEffect(() => {
        let num = parseInt(vddtx);

        if (isNaN(num) || isNaN(Number(vddtx))) {
            setVddtxError(true);
        }
        else {
            if (num > 4000)
                setVddtx('4000');
            else if (num < 0)
                setVddtx('0');
            context.vddtx = num;
            //console.log(context.vddtx);
            setVddtxError(false);
        }
    }, [vddtx]);

    useEffect(() => {
        let num = parseInt(vled);

        if (isNaN(num) || isNaN(Number(vled))) {
            setVledError(true);
        }
        else {
            if (num > 4000)
                setVled('4000');
            else if (num < 0)
                setVled('0');
            context.vled = num;
            //console.log(context.vled);
            setVledError(false);
        }
    }, [vled]);

    useEffect(() => {
        let num = parseInt(vpu);

        if (isNaN(num) || isNaN(Number(vpu))) {
            setVpuError(true);
        }
        else {
            if (num > 4000)
                setVpu('4000');
            else if (num < 0)
                setVpu('0');
            context.vpu = num;
            //console.log(context.vpu);
            setVpuError(false);
        }
    }, [vpu]);

    useEffect(() => {
        if (power == 'Default' && defaultJson != '') {
            let jsonDefault = JSON.parse(defaultJson);

            setVdd(jsonDefault['vdd'])
            setVpu(jsonDefault['vpu'])
            setVled(jsonDefault['vled'])
            setVddtx(jsonDefault['vddtx'])
        }
    }, [power]);

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
            setDefaultJson(jsonDefaultString);

            let jinterfaces = jsonDefault['interfaces'];
            setInterfaces(jinterfaces);

            let jsonCustom = JSON.parse(jsonCustomString);

            //json object deep copy
            let jsonMerge = JSON.parse(JSON.stringify(jsonDefault))
            jsonMerge = Object.assign(jsonMerge, jsonCustom);
            console.log(jsonMerge);
            //jsonMergeRef.current = jsonMerge;

            let jprotocol = jsonMerge['interfaces'];
            let ji2cAddr = jsonMerge['i2cAddr'];
            let jspiMode = jsonMerge['spiMode'];
            let jspeed = jsonMerge['speed'];
            let jattn = jsonMerge['useAttn'];
            let jpowerVdd = jsonMerge['vdd'];
            let jpowerVddtx = jsonMerge['vddtx'];
            let jpowerVled = jsonMerge['vled'];
            let jpowerVpu = jsonMerge['vpu'];

            //console.log(jprotocol);
            //console.log(ji2cAddr);
            //console.log(jspiMode);
            //console.log(jattn);
            //console.log(jspeed);

            if (jprotocol.length > 1) {
                setProtocol("auto");
            } else {
                setProtocol(jprotocol[0]);

                if (jspeed == null) {
                    setSpeedSpi(DEFAULT_SPEED_SPI);
                    setSpeedI2c(DEFAULT_SPEED_I2C);
                } else if (jprotocol[0] == "spi") {
                    setSpeedSpi(jspeed.toString());
                } else if (jprotocol[0] == "i2c") {
                    setSpeedI2c(jspeed.toString());
                }
            }

            setAddr(ji2cAddr.toString());
            setMode(jspiMode);

            if (jattn)
                setAttn(1);
            else
                setAttn(0);

            setVdd(jpowerVdd.toString());
            setVddtx(jpowerVddtx.toString());
            setVled(jpowerVled.toString());
            setVpu(jpowerVpu.toString());

            if ((jpowerVdd != jsonDefault['vdd']) || (jpowerVddtx != jsonDefault['vddtx']) ||
                (jpowerVled != jsonDefault['vled']) || (jpowerVpu != jsonDefault['vpu']))
                setPower('Custom');
            else
                setPower('Default');
        }
        catch(error) {
            showError(error);
        }
    };


    const handleChange = (event: SelectChangeEvent<typeof protocol>) => {
        console.log(event.target.value);
        setProtocol(event.target.value);
    };

    const handlePowerSelectChange = (event: SelectChangeEvent<typeof power>) => {
        console.log(event.target.value);
        setPower(event.target.value);
    };

    const handleSpiModeChange = (event: SelectChangeEvent) => {
        setMode(event.target.value);
    };

    const handleAttnChange = (event: SelectChangeEvent) => {
        setAttn(event.target.value);
    };

    const handleI2cAddrChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAddr(event.target.value);
    };

    const handleSpeedI2cChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSpeedI2c(event.target.value);
    };

    const handleSpeedSpiChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSpeedSpi(event.target.value);
    };

    const handlePowerChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, source: string) => {
        console.log(event.target.value);
        console.log(source);
        if (source == 'VDDL')
            setVdd(event.target.value);
        else if (source == 'VDD12')
            setVddtx(event.target.value);
        else if (source == 'VDDH')
            setVled(event.target.value);
        else if (source == 'VBUS')
            setVpu(event.target.value);
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

    function SetSpeed() {
        console.log("[speed]");

        if (protocol == "auto")
            context.speed = SPEED_AUTO_SCAN;
        else if (protocol == "i2c")
            context.speed = speedI2c;
        else if (protocol == "spi")
            context.speed = speedSpi;
    }

    function UpdateSettings() {
        setLoad(true);
        setAlert(false);
        SetSpeed();
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

    const webdsTheme = props.service.ui.getWebDSTheme();

    return (
        <div className='jp-webds-widget-body'>
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
                        <FormControl variant="standard" sx={{ m: 1, width: LEVEL1_SELECT_WIDTH }}>
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
                                    <Stack spacing={2} sx={{
                                        flexDirection: 'column',
                                        display: 'flex',
                                        alignItems: "left",
                                    }}>
                                        <SelectI2cAddr handleChange={handleI2cAddrChange} addr={addr} error={addrError} />
                                        <SelectSpeed handleChange={handleSpeedI2cChange} speed={speedI2c} error={speedI2cError} name='I2C Speed' unit='KHz' />
                                    </Stack>
                                </Collapse>

                                <Collapse in={isSpi}>
                                    <Stack spacing={2} sx={{
                                        flexDirection: 'column',
                                        display: 'flex',
                                        alignItems: "left",
                                    }}>
                                        <SelectSpiMode handleChange={handleSpiModeChange} mode={mode} />
                                        <SelectSpeed handleChange={handleSpeedSpiChange} speed={speedSpi} error={speedSpiError} name='SPI Speed' unit='KHz'/>
                                    </Stack>
                                </Collapse>
                            </Stack>
                        </Paper>
                    </Collapse>

                    <div>
                        <FormControl variant="standard" sx={{ m: 1, width: LEVEL1_SELECT_WIDTH }}>
                            <InputLabel id="connection-power-label">Voltage</InputLabel>
                            <Select
                                labelId="connection-power-label"
                                id="connection-power"
                                label="Voltage"
                                onChange={handlePowerSelectChange}
                                value={power}
                            >
                                {['Default', 'Custom'].map((value) => {
                                    return (
                                        <MenuItem value={value}>{value}</MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </div>

                    <Collapse in={power != 'Default'}>
                        <Paper variant="outlined" square sx={{ ml: 1 }}>
                            <Stack spacing={1} sx={{
                                flexDirection: 'column',
                                display: 'flex',
                                alignItems: "left",
                                p: 1
                            }}>
                                <SelectPower name="VDDL" handleChange={handlePowerChange} power={vdd} error={vddError}/>
                                <SelectPower name="VDDH" handleChange={handlePowerChange} power={vled} error={vledError} />
                                <SelectPower name="VDD12" handleChange={handlePowerChange} power={vddtx} error={vddtxError} />
                                <SelectPower name="VBUS" handleChange={handlePowerChange} power={vpu} error={vpuError}/>
                            </Stack>
                        </Paper>
                    </Collapse>

                    <SelectAttn handleChange={handleAttnChange} attn={attn} />

                    <Box sx={{ pt: 1, '& > :not(style)': { m: 1 } }}>
                        <Button color="primary" variant="contained" onClick={() => ResetDefault()}>
                            Reset
                        </Button>
                        <Button color="primary" variant="contained" onClick={() => UpdateSettings()}
                            disabled={addrError || speedSpiError || speedI2cError || vddError || vddtxError || vledError || vpuError}>
                            Apply
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
    service: WebDSService;
    /**
    * Constructs a new CounterWidget.
    */
    constructor(service: WebDSService) {
        super();
        this.addClass('jp-webds-widget');
        this.service = service
        console.log("TabPanelUiWidget is created!!!");
    }

    handleChangeFile(e: React.ChangeEvent<HTMLInputElement>) {
        console.log(e.currentTarget.files);
    }

    render(): JSX.Element {
        return <ConnectionWidget service={this.service}/>;
    }
}
