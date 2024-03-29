import React, { useEffect, useState, useRef } from "react";


import {
    Paper, Collapse, Switch, ListItemText,
    ListItemIcon,
    ListItemButton,
    ListItem,
    Divider,
    List,
    Button,
    SwipeableDrawer,
    Box
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import WifiPasswordIcon from "@mui/icons-material/WifiPassword";
import WifiIcon from "@mui/icons-material/Wifi";
import CloseIcon from "@mui/icons-material/Close";

import { requestAPI } from "./handler";

import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  LinearProgress,
  Stack,
  Typography
} from "@mui/material";

type Anchor = "top" | "left" | "bottom" | "right";

interface wifiElement {
  name: string;
  secure: boolean;
}

interface State {
  password: string;
  showPassword: boolean;
}

const WIFI_SCAN_INTERVAL = 4000;
//const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function WifiSettings() {
  const [wifiInitDone, setWifiInitDone] = useState(false);
  const [rootState, setRootState] = useState<string[]>(["wifi"]);
  const [wifiProgress, setWifiProgress] = useState(false);
  const [wifiConnectError, setWifiConnectError] = useState(false);
  const [wifiCurrent, setWifiCurrent] = useState("");
  const [select, setSelect] = useState("");
  const [showConnectButton, setShowConnectButton] = useState(false);
  const [showConnectPage, setShowConnectPage] = useState(false);
  const [wifiList, setWifiList] = useState<wifiElement[]>([]);
  const [state, setState] = useState({
    top: false,
    left: false,
    bottom: false,
    right: false
  });

  const [values, setValues] = useState<State>({
    password: "",
    showPassword: false
  });
  const wifiIntervalId = useRef(null);
  const pauseScanWifi = useRef(false);
  const wifiProcessing = useRef(false);
  const stopScanWifi = useRef(false);

    function enableWifiAsSTA() {
        setWifiInitDone(false);
        SendWifiPost({ "action": "turnOn" })
            .then((ret) => {
                return SendWifiPost({ "action": "setSTA" })
            })
            .then((ret) => {
                return init(true);
            })
            .then((ret) => {
                setWifiInitDone(true);
                startWifiInterval();
            })
            .catch((e) => {
                alert(e);
                setWifiInitDone(true);
                init(false);
            })
    }

    const toggleDrawer = (anchor: Anchor, open: boolean) => async (
    event: React.KeyboardEvent | React.MouseEvent
  ) => {
    if (
      event &&
      event.type === "keydown" &&
      ((event as React.KeyboardEvent).key === "Tab" ||
        (event as React.KeyboardEvent).key === "Shift")
    ) {
      destroy();
      return;
    }
        if (open) {
        // hardcode to set wifi on
        // fixed to read wifi state from server
        setRootState(["wifi"])
        stopScanWifi.current = false;
        enableWifiAsSTA();
    }
    else {
      destroy();
    };
    setState({ ...state, [anchor]: open });
  };

  useEffect(() => {
      pauseScanWifi.current = showConnectPage || showConnectButton;
  }, [showConnectPage, showConnectButton]);

    const SendGetWifiList = async (): Promise<wifiElement[]> => {
    try {
      let url = "settings/wifi";

      const reply = await requestAPI<any>(url, {
        method: "GET"
      });

      let wifi_list = reply["list"].map((element) => {
        let item: wifiElement = { name: "", secure: false };
        item.name = element[0];
        item.secure = element[1] === "secured";
        return item;
      });

      let connected = reply["connected"];
      if (connected) {
        setWifiCurrent(wifi_list[0]["name"]);
      } else {
        setWifiCurrent("");
      }
      return Promise.resolve(wifi_list);
    } catch (e) {
      console.error(`Error on GET.\n${e}`);
      return Promise.reject((e as Error).message);
    }
  };

  const SendConnectToWifi = async (): Promise<string> => {
	let dataToSend = {
      "action": "connect",
      "network": select,
      "password": values.password
	}

    try {
      const reply = await requestAPI<any>("settings/wifi", {
        body: JSON.stringify(dataToSend),
        method: "POST"
      });

	  if (reply["status"] === true)
        return Promise.resolve(JSON.stringify(reply));
      else
        return Promise.reject("connect failed.");
    } catch (e) {
      console.error(`Error on POST ${dataToSend}.\n${e}`);
      return Promise.reject((e as Error).message);
    }
  };

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

  function startWifiInterval() {
      wifiIntervalId.current = setInterval(async () => {
        if (stopScanWifi.current) {
            clearInterval(wifiIntervalId.current);
            return;
        }
        if (pauseScanWifi.current || wifiProcessing.current) {
        }
        else {
            wifiProcessing.current = true;
            await init(false);
          wifiProcessing.current = false;
      }
    }, WIFI_SCAN_INTERVAL);
  };

    async function init(showProgress: boolean) {
    if (showProgress)
      setWifiInitDone(false);
        try {
          let list = [];
          for (let i = 0; i < 10; i++) {
              list = await SendGetWifiList();
              if (list.length !== 0) {
                  setWifiList(list);
                  // send one more time to check connected ssid
                  list = await SendGetWifiList();
                  break;
              }
            }

          setWifiList(list);
        if (showProgress)
            setWifiInitDone(true);
      } catch (e) {
      setWifiCurrent("");
          setWifiList([]);
      if (showProgress)
        setWifiInitDone(true);
    }
  }

  function destroy() {
    resetParams();
    setWifiProgress(false);
    stopScanWifi.current = true;
    clearInterval(wifiIntervalId.current);
  }

   useEffect(() => {
       return () => {
         //handle unexpected close
         destroy();
       }
  }, []);

  function resetParams() {
    setWifiConnectError(
        false);
    setShowConnectPage(false);
    setShowConnectButton(false);
    setValues({
      password: "",
      showPassword: false
    });
  }

  function onWifiConnectNext(e: any) {
    e.stopPropagation();
    setWifiProgress(true);
    SendConnectToWifi()
      .then((ret) => {
        setSelect("");
        resetParams();
        init(false);
        setWifiProgress(false);
      })
      .catch((e) => {
		init(false);
        setWifiProgress(false);
        setWifiConnectError(true);
      });
  }

  function onWifiConnectCancel(e: any) {
    e.stopPropagation();
    resetParams();
  }

  const handleToggle = (value: string) => () => {
    const currentIndex = rootState.indexOf(value);
    const newChecked = [...rootState];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    resetParams();

    setRootState(newChecked);

    if (value === "wifi") {
        if (currentIndex === -1) {
            setWifiList([]);
            enableWifiAsSTA();
      }
        else {
            destroy();
            SendWifiPost({"action": "turnOff"})
      }
    }
  };

  function displayWifiRoot() {
    return (
      <>
        <ListItem>
          <ListItemIcon>
            <WifiIcon />
          </ListItemIcon>
          <ListItemText id="switch-list-label-wifi" primary="Wi-Fi" />
          <Switch
            edge="end"
            onChange={handleToggle("wifi")}
            checked={rootState.indexOf("wifi") !== -1}
            inputProps={{
              "aria-labelledby": "switch-list-label-wifi"
            }}
          />
        </ListItem>
        {wifiInitDone === false && <LinearProgress sx={{ m: 3, ml: 8 }} />}
      </>
    );
  }

  function onClickWifiElement(name: string) {
    resetParams();
    setSelect(name);
    setShowConnectButton(true);
  }

  function onClickWifiConnect(e, toConnect: boolean) {
    e.stopPropagation();
    if (toConnect) {
      setShowConnectPage(true);
    } else {
      resetParams();
        SendWifiPost({
            "action": "disconnect"
        })
        .then((ret) => {
          init(false);
        })
        .catch((e) => {
          init(false);
		})
    }
    setShowConnectButton(false);
  }

  const handleChange = (prop: keyof State) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword
    });
  };

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  function displayInputSecurityKey(index) {
    return (
      <FormControl
        key={`page-input-form-${index}`}
        sx={{ m: 1, width: "25ch" }}
        variant="standard"
      >
        <InputLabel
          key={`page-input-label-${index}`}
          htmlFor="standard-adornment-password"
        >
          Password
        </InputLabel>
        <Input
          key={`page-input-input-${index}`}
          error={wifiConnectError}
          id="standard-adornment-password"
          type={values.showPassword ? "text" : "password"}
          value={values.password}
          onChange={handleChange("password")}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onWifiConnectNext(e);
            }
          }}
          endAdornment={
            <InputAdornment
              key={`page-input-adornment-${index}`}
              position="end"
            >
              <IconButton
                key={`page-input-icon-button-${index}`}
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
              >
                {values.showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />
        {wifiConnectError &&
          "The network security key isn't correct. Please try again."}
      </FormControl>
    );
  }
  function displayConnectPage(index) {
    return (
        <Paper key={`page-paper-root--${index}`} sx={{p: 1}}>
        {wifiProgress ? (
          <LinearProgress key={`page-progress-${index}`} sx={{ m: 3 }} />
        ) : (
          <Stack
            key={`page-stack1-${index}`}
            spacing={2}
            alignItems="flex-end"
            sx={{ pr: 7 }}
          >
            {displayInputSecurityKey(index)}
            <Stack key={`page-stack2-${index}`} direction="row" spacing={2}>
              <Button
                key={`page-button-next-${index}`}
                variant="outlined"
                size="small"
                onClick={(e) => onWifiConnectNext(e)}
                disabled={values.password === ""}
                sx={{ width: 80 }}
              >
                Next
              </Button>
              <Button
                key={`page-button-cancel-${index}`}
                variant="outlined"
                size="small"
                onClick={(e) => onWifiConnectCancel(e)}
                sx={{ width: 80 }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        )}
      </Paper>
    );
  }

  function displayWifiItemIcon(element, index) {
    const param = {
      bgcolor: "inherit",
      color: "inherit"
    };

    if (element.name === wifiCurrent) {
      param.color = "primary";
    }
    return (
      <>
        {element.secure ? (
          <WifiPasswordIcon key={`wifi-item-icon-${index}`} sx={param} />
        ) : (
          <WifiIcon key={`wifi-item-icon-${index}`} sx={param} />
        )}
      </>
    );
  }

  function displayWifiList() {
    return (
      <Collapse
        in={rootState.indexOf("wifi") !== -1}
        timeout="auto"
        unmountOnExit
      >
        <List component="div" disablePadding>
          {wifiList.map((element, index) => (
            <Stack key={`top-stack-${index}`}>
              <ListItemButton
                key={`ListItemButton-${index}`}
                sx={{ pl: 4 }}
                onClick={() => onClickWifiElement(element.name)}
              >
                <ListItemIcon key={`ListItemIcon-${index}`}>
                  {displayWifiItemIcon(element, index)}
                </ListItemIcon>
                <ListItemText key={`ListItemText-${index}`}>
                  {element.name}
                  {wifiCurrent === element.name && (
                    <Typography
                      key={`Typography-current-${index}`}
                      sx={{ fontSize: 12 }}
                    >
                      Connected
                    </Typography>
                  )}
                </ListItemText>
                {select === element.name && showConnectButton && (
                  <Button
                    key={`Button-${index}`}
                    size="small"
                    variant="outlined"
                    onClick={(e) =>
                      onClickWifiConnect(e, wifiCurrent !== element.name)
                    }
                  >
                    {wifiCurrent === element.name ? "Disconnect" : "Connect"}
                  </Button>
                )}
              </ListItemButton>
              {select === element.name &&
                showConnectPage &&
                displayConnectPage(index)}
            </Stack>
          ))}
        </List>
      </Collapse>
    );
  }

  const list = (anchor: Anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 350 }}
      role="presentation"
    >
      <List>
        <ListItem
          secondaryAction={
            <IconButton
              aria-label="comment"
              onClick={toggleDrawer("right", false)}
            >
              <CloseIcon />
            </IconButton>
          }
        >
          <ListItemText primary="Settings" />
        </ListItem>
        <Divider />
        {displayWifiRoot()}
        {displayWifiList()}
      </List>
    </Box>
  );

  return (
    <div>
      <React.Fragment>
        <Button variant="contained" onClick={toggleDrawer("right", true)}>
          {"PinormOS Wifi Settings"}
        </Button>
        <SwipeableDrawer
          anchor={"right"}
          open={state["right"]}
          onClose={toggleDrawer("right", false)}
          onOpen={toggleDrawer("right", true)}
        >
          {list("right")}
        </SwipeableDrawer>
      </React.Fragment>
    </div>
  );
}
