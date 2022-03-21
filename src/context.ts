import { createContext } from 'react';

export const UserContext = createContext({
    interfaces: ["i2c"],
    i2cAddr: 128,
    spiMode: -1,
    speed: null,
    useAttn: false,
});