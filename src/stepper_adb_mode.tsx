import React, { useState, useEffect } from "react";

import {
  Stack,
  Chip,
  Typography,
  Paper,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress
} from "@mui/material";

import { requestAPI } from "./handler";

import WifiSettings from "./wifi";
import StarRateIcon from "@mui/icons-material/StarRate";

const STEP_PAPER_WIDTH = 940;
const STEP_PAPER_HEIGHT = 380;

const ImageArea = (props) => (
  <Stack direction="row" justifyContent="flex-start" alignItems="center">
    <div style={{ border: "1px solid" }}>{props.children}</div>
  </Stack>
);

export default function StepperModeSelect(props: any) {
    const [modeAP, setModeAP] = useState(false);
    const [mode, setMode] = useState("AP");
    const [staDefaultAddress, setStaDefaultAddress] = useState("");
  const [steps, setSteps] = useState([
    {
      label: "",
      content: <></>
      },
      {
          label: "",
          content: <></>
      },
  ]);

    const SendWifiPost = async (dataToSend: any): Promise<string> => {
        try {
            const reply = await requestAPI<any>("settings/wifi", {
                body: JSON.stringify(dataToSend),
                method: "POST"
            });
            return Promise.resolve(JSON.stringify(reply));

        } catch (e) {
            console.error(`Error on POST ${dataToSend}.\n${e}`);
            return Promise.reject((e as Error).message);
        }
    };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setMode((event.target as HTMLInputElement).value);

      if (props.updateSettings) {
          props.updateSettings([
              { name: "mode", value: event.target.value }
          ]);

          if (event.target.value === "AP") {
              props.updateSettings([
                  { name: "ipAddress", value: "192.168.7.2" }
              ]);
          } else {
              props.updateSettings([
                  { name: "ipAddress", value: staDefaultAddress }
              ]);
          }
      }
  };

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
          sx={{ m: 0, fontSize: 13, color: "#005780", mr: 2 }}
          align="center"
        >
          {m}
        </Typography>
      </Stack>
    );
  }

  function showModeSelect() {
    return {
      label: "Setup Wi-Fi Mode",
      content: (
        <Stack spacing={2}>
          <Typography sx={{ fontSize: 12 }}>
            Configure Wi-Fi as an access point (AP) or as a wireless
            client/station (STA)
          </Typography>

          <FormControl>
            <FormLabel id="radio-buttons-group">Mode</FormLabel>
            <RadioGroup
              aria-labelledby="radio-buttons-group"
              name="radio-buttons-group"
              value={mode}
              onChange={handleChange}
            >
              <FormControlLabel value="AP" control={<Radio />} label="Access Point (AP)" />
              <FormControlLabel value="STA" control={<Radio />} label="Wireless Client/Station (STA)" />
            </RadioGroup>
          </FormControl>
        </Stack>
      )
    };
  }

  function showApModeInstruction() {
    return {
      label: "Pair a device in AP mode",
      content: (
        <Stack spacing={2}>
          <Typography sx={{ fontSize: 12 }}>
            use your Android device and go to Settings -{`>`} Wireless & networks -{`>`} Wi-Fi settings
          </Typography>
          <Typography sx={{ fontSize: 12 }}>
            Connect to wireless network network syna-pi
          </Typography>
          {showNoteMessage(
            " In AP mode, the connected Android device will always be assigned an IP address of 192.168.7.2"
              )}
          <ImageArea>
            <div className="jp-enableWifiDebugImage"></div>
          </ImageArea>
        </Stack>
      )
    };
  }

  function showStepPinormOsWiFiNetwork() {
    return {
      label: "PinormOS Wifi Network",
      content: (
        <Stack spacing={2}>
          <div>
            <Typography sx={{ fontSize: 12 }}>
              Check your device and PinormOS are on the same Wi-Fi network
            </Typography>
          </div>
          <WifiSettings />
        </Stack>
      )
    };
  }

  const stepsAP = [showModeSelect(), showApModeInstruction()];
  const stepsSTA = [showModeSelect(), showStepPinormOsWiFiNetwork()];

    useEffect(() => {
        let ip = "";
        let wifiMode = "";
          [...props.defaultSettings].forEach((element) => {
              switch (element.name) {
                  case "mode":
                      wifiMode = element.value;
                      setMode(wifiMode);
                      break;
                  case "ipAddress":
                      ip = element.value;
                  default:
                      break;
              }
          });

          if (wifiMode === "STA") {
              setStaDefaultAddress(ip);
          }
    }, [props.defaultSettings]);

    useEffect(() => {
        if (mode === "AP" && props.activeStep === 1) {
            setModeAP(true);
            SendWifiPost({ "action": "setAP" }).then((ret) => {
                if (ret.includes("Error")) {
                    alert(ret);
                }
                setModeAP(false);
            }).catch((e) => {
                alert(e);
                setModeAP(false);
            })
        }
    }, [props.activeStep]);

  useEffect(() => {
    if (mode === "AP") {
      setSteps(stepsAP);
    } else if (mode === "STA") {
      setSteps(stepsSTA);
    }
  }, [mode]);

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
            <Chip variant="outlined" label={`Step 1-${props.activeStep + 1}`} />
            <Typography>{steps[props.activeStep].label}</Typography>
          </Stack>
          {
            modeAP === true &&
            <Box sx={{ width: '100%' }}>
                <LinearProgress />
            </Box>
          }
          <Stack sx={{ pl: 10 }}>{steps[props.activeStep].content}</Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
