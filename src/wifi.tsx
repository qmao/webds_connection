import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Switch from "@mui/material/Switch";
import Collapse from "@mui/material/Collapse";

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

////const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  const toggleDrawer = (anchor: Anchor, open: boolean) => (
    event: React.KeyboardEvent | React.MouseEvent
  ) => {
    if (
      event &&
      event.type === "keydown" &&
      ((event as React.KeyboardEvent).key === "Tab" ||
        (event as React.KeyboardEvent).key === "Shift")
    ) {
      return;
    }
    1;
    setState({ ...state, [anchor]: open });
  };

  const SendGetWifiList = async (): Promise<wifiElement[]> => {
    try {
      let url = "settings/wifi";

      const reply = await requestAPI<any>(url, {
        method: "GET"
      });

      let wifi_list = reply["list"].map((element) => {
        let item: wifiElement = { name: "", secure: false };
        item.name = element[0];
        item.secure = element[1] === "(secured)";
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

  const SendDisconnectToWifi = async (): Promise<string> => {
	let dataToSend = {
      "action": "disconnect",
	}

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

  async function init(showProgress: boolean) {
    if (showProgress)
      setWifiInitDone(false);
	setWifiCurrent("");
    await SendGetWifiList()
      .then((list) => {
        setWifiList(list);
		if (showProgress)
          setWifiInitDone(true);
      })
      .catch((e) => {
        setWifiList([]);
		if (showProgress)
          setWifiInitDone(true);
      });
  }

  useEffect(() => {
    init(true);
  }, []);

  function resetParams() {
    setWifiConnectError(false);
    setShowConnectPage(false);
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

    //setChecked(newChecked);
    resetParams();

    setRootState(newChecked);

    if (value === "wifi") {
      if (currentIndex === -1) {
        init(true);
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
      SendDisconnectToWifi()
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
      <Stack key={`page-stack-root--${index}`} sx={{ bgcolor: "grey" }}>
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
      </Stack>
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
          onClose={toggleDrawer("right", true)}
          onOpen={toggleDrawer("right", true)}
        >
          {list("right")}
        </SwipeableDrawer>
      </React.Fragment>
    </div>
  );
}
