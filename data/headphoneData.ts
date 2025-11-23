
import { HeadphoneProfile } from '../types';

export const headphoneProfiles: HeadphoneProfile[] = [
    {
        name: "AKG K52",
        preamp: -6.8,
        filters: [
            { type: "LSC", fc: 105, gain: -4.6, q: 0.70 },
            { type: "PK", fc: 1892, gain: 7.2, q: 1.08 },
            { type: "PK", fc: 186, gain: -7.6, q: 1.41 },
            { type: "PK", fc: 4703, gain: -7.3, q: 0.98 },
            { type: "PK", fc: 3321, gain: 8.2, q: 2.34 },
            { type: "HSC", fc: 10000, gain: -5.5, q: 0.70 },
            { type: "PK", fc: 97, gain: 2.9, q: 3.14 },
            { type: "PK", fc: 62, gain: -1.4, q: 1.34 },
            { type: "PK", fc: 483, gain: -2.2, q: 2.46 },
            { type: "PK", fc: 370, gain: 2.8, q: 5.73 }
        ]
    },
    {
        name: "AKG K612 Pro",
        preamp: -6.2,
        filters: [
            { type: "LSC", fc: 105, gain: 6.2, q: 0.70 },
            { type: "PK", fc: 2828, gain: -3.8, q: 1.72 },
            { type: "PK", fc: 877, gain: 1.9, q: 1.62 },
            { type: "PK", fc: 5761, gain: -5.3, q: 5.54 },
            { type: "PK", fc: 3851, gain: 2.1, q: 3.59 },
            { type: "HSC", fc: 10000, gain: -6.5, q: 0.70 },
            { type: "PK", fc: 225, gain: -1.1, q: 1.69 },
            { type: "PK", fc: 105, gain: 0.8, q: 2.67 },
            { type: "PK", fc: 1492, gain: 1.0, q: 5.22 },
            { type: "PK", fc: 1926, gain: -0.4, q: 3.24 }
        ]
    },
    {
        name: "AKG K701",
        preamp: -6.0,
        filters: [
            { type: "LSC", fc: 105, gain: 6.0, q: 0.70 },
            { type: "PK", fc: 202, gain: -2.3, q: 0.49 },
            { type: "PK", fc: 1294, gain: 3.7, q: 2.62 },
            { type: "PK", fc: 594, gain: 3.4, q: 2.00 },
            { type: "PK", fc: 2360, gain: -3.6, q: 3.71 },
            { type: "HSC", fc: 10000, gain: -9.2, q: 0.70 },
            { type: "PK", fc: 3511, gain: 2.4, q: 5.34 },
            { type: "PK", fc: 5068, gain: 1.6, q: 2.91 },
            { type: "PK", fc: 6180, gain: -2.4, q: 6.00 },
            { type: "PK", fc: 21, gain: 0.1, q: 3.33 }
        ]
    },
    {
        name: "AKG K702",
        preamp: -6.1,
        filters: [
            { type: "LSC", fc: 105, gain: 6.1, q: 0.70 },
            { type: "PK", fc: 2252, gain: -5.4, q: 1.41 },
            { type: "PK", fc: 778, gain: 3.6, q: 1.07 },
            { type: "PK", fc: 95, gain: 2.2, q: 2.23 },
            { type: "PK", fc: 1121, gain: -2.2, q: 3.09 },
            { type: "HSC", fc: 10000, gain: -12.5, q: 0.70 },
            { type: "PK", fc: 4638, gain: 3.0, q: 4.04 },
            { type: "PK", fc: 6398, gain: -4.1, q: 6.00 },
            { type: "PK", fc: 666, gain: -0.2, q: 3.04 },
            { type: "PK", fc: 10000, gain: 5.8, q: 1.67 }
        ]
    },
    {
        name: "Audeze LCD-X",
        preamp: -5.8,
        filters: [
            { type: "LSC", fc: 105, gain: 6.3, q: 0.70 },
            { type: "PK", fc: 867, gain: -4.1, q: 1.16 },
            { type: "PK", fc: 4264, gain: 10.0, q: 0.48 },
            { type: "PK", fc: 5568, gain: -13.2, q: 1.74 },
            { type: "PK", fc: 138, gain: -3.8, q: 0.20 },
            { type: "HSC", fc: 10000, gain: -10.3, q: 0.70 },
            { type: "PK", fc: 138, gain: 0.4, q: 1.67 },
            { type: "PK", fc: 26, gain: 0.6, q: 2.65 },
            { type: "PK", fc: 38, gain: -0.7, q: 2.87 },
            { type: "PK", fc: 234, gain: -0.4, q: 2.24 }
        ]
    },
    {
        name: "Audient EVO SR2000",
        preamp: -6.4,
        filters: [
            { type: "LSC", fc: 105, gain: 3.9, q: 0.70 },
            { type: "PK", fc: 54, gain: -9.1, q: 0.55 },
            { type: "PK", fc: 862, gain: -3.1, q: 1.33 },
            { type: "PK", fc: 3347, gain: 3.9, q: 1.68 },
            { type: "PK", fc: 32, gain: 8.6, q: 0.83 },
            { type: "HSC", fc: 10000, gain: -3.9, q: 0.70 },
            { type: "PK", fc: 325, gain: 2.1, q: 3.05 },
            { type: "PK", fc: 198, gain: -1.0, q: 1.51 },
            { type: "PK", fc: 5534, gain: -3.7, q: 6.00 },
            { type: "PK", fc: 2113, gain: 1.3, q: 3.36 }
        ]
    },
    {
        name: "Audio-Technica ATH-M40x",
        preamp: -3.0,
        filters: [
            { type: "LSC", fc: 105, gain: 0.5, q: 0.70 },
            { type: "PK", fc: 155, gain: -5.0, q: 2.11 },
            { type: "PK", fc: 317, gain: 3.4, q: 1.43 },
            { type: "PK", fc: 2637, gain: 2.2, q: 1.93 },
            { type: "PK", fc: 1444, gain: -1.6, q: 1.64 },
            { type: "HSC", fc: 10000, gain: -13.0, q: 0.70 },
            { type: "PK", fc: 8015, gain: 3.6, q: 1.03 },
            { type: "PK", fc: 54, gain: -1.7, q: 1.72 },
            { type: "PK", fc: 82, gain: 3.3, q: 4.47 },
            { type: "PK", fc: 4262, gain: -2.5, q: 6.00 }
        ]
    },
    {
        name: "Audio-Technica ATH-M50x",
        preamp: -4.9,
        filters: [
            { type: "LSC", fc: 105, gain: 1.8, q: 0.70 },
            { type: "PK", fc: 149, gain: -5.2, q: 1.23 },
            { type: "PK", fc: 349, gain: 4.4, q: 1.51 },
            { type: "PK", fc: 6201, gain: 5.0, q: 2.42 },
            { type: "PK", fc: 4296, gain: -4.5, q: 4.03 },
            { type: "HSC", fc: 10000, gain: -11.8, q: 0.70 },
            { type: "PK", fc: 9752, gain: 4.4, q: 1.16 },
            { type: "PK", fc: 2246, gain: -1.7, q: 2.74 },
            { type: "PK", fc: 41, gain: -1.3, q: 2.06 },
            { type: "PK", fc: 59, gain: 2.4, q: 4.76 }
        ]
    },
    {
        name: "Audio-Technica ATH-R70x",
        preamp: -6.3,
        filters: [
            { type: "LSC", fc: 105, gain: 7.1, q: 0.70 },
            { type: "PK", fc: 99, gain: -3.6, q: 0.39 },
            { type: "PK", fc: 4807, gain: 4.7, q: 4.08 },
            { type: "PK", fc: 8242, gain: 3.1, q: 2.44 },
            { type: "PK", fc: 41, gain: 1.6, q: 3.40 },
            { type: "HSC", fc: 10000, gain: -7.6, q: 0.70 },
            { type: "PK", fc: 2010, gain: 0.7, q: 3.36 },
            { type: "PK", fc: 3506, gain: -1.8, q: 5.57 },
            { type: "PK", fc: 10000, gain: 3.9, q: 1.79 },
            { type: "PK", fc: 3058, gain: 1.5, q: 6.00 }
        ]
    },
    {
        name: "AUNE AR5000",
        preamp: -5.8,
        filters: [
            { type: "LSC", fc: 105, gain: 8.1, q: 0.70 },
            { type: "PK", fc: 86, gain: -4.8, q: 0.25 },
            { type: "PK", fc: 1622, gain: 3.9, q: 1.57 },
            { type: "PK", fc: 8602, gain: 4.9, q: 1.62 },
            { type: "PK", fc: 4916, gain: -3.0, q: 3.03 },
            { type: "HSC", fc: 10000, gain: -5.6, q: 0.70 },
            { type: "PK", fc: 2966, gain: -2.0, q: 4.78 },
            { type: "PK", fc: 3563, gain: 2.6, q: 6.00 },
            { type: "PK", fc: 96, gain: 0.5, q: 1.42 },
            { type: "PK", fc: 56, gain: -0.5, q: 1.70 }
        ]
    },
    {
        name: "Beats Studio3 Wireless",
        preamp: -6.4,
        filters: [
            { type: "LSC", fc: 105, gain: 2.8, q: 0.70 },
            { type: "PK", fc: 81, gain: -6.6, q: 0.40 },
            { type: "PK", fc: 1997, gain: 4.5, q: 1.31 },
            { type: "PK", fc: 32, gain: 7.2, q: 0.81 },
            { type: "PK", fc: 9564, gain: -6.2, q: 6.00 },
            { type: "HSC", fc: 10000, gain: 1.0, q: 0.70 },
            { type: "PK", fc: 576, gain: 2.8, q: 2.61 },
            { type: "PK", fc: 263, gain: -1.7, q: 0.90 },
            { type: "PK", fc: 3564, gain: -3.6, q: 6.00 },
            { type: "PK", fc: 149, gain: 2.1, q: 2.39 }
        ]
    },
    {
        name: "Behringer HC 200",
        preamp: -6.1,
        filters: [
            { type: "LSC", fc: 105, gain: 5.7, q: 0.70 },
            { type: "PK", fc: 1052, gain: -10.6, q: 0.89 },
            { type: "PK", fc: 2063, gain: 10.5, q: 0.44 },
            { type: "PK", fc: 1412, gain: -6.5, q: 1.44 },
            { type: "PK", fc: 354, gain: -4.6, q: 0.68 },
            { type: "HSC", fc: 10000, gain: -3.6, q: 0.70 },
            { type: "PK", fc: 6984, gain: 3.3, q: 3.38 },
            { type: "PK", fc: 71, gain: -0.9, q: 2.38 },
            { type: "PK", fc: 5724, gain: -2.5, q: 6.00 },
            { type: "PK", fc: 150, gain: 0.5, q: 2.71 }
        ]
    },
    {
        name: "Beyerdynamic DT 770 Pro (80 Ohm)",
        preamp: -5.6,
        filters: [
            { type: "LSC", fc: 105, gain: 3.4, q: 0.70 },
            { type: "PK", fc: 118, gain: -4.5, q: 1.07 },
            { type: "PK", fc: 184, gain: 5.8, q: 2.15 },
            { type: "PK", fc: 396, gain: -1.0, q: 1.20 },
            { type: "PK", fc: 68, gain: 4.4, q: 4.37 },
            { type: "HSC", fc: 10000, gain: -8.3, q: 0.70 },
            { type: "PK", fc: 3622, gain: 4.5, q: 4.09 },
            { type: "PK", fc: 40, gain: -1.1, q: 2.98 },
            { type: "PK", fc: 2632, gain: -2.3, q: 3.17 },
            { type: "PK", fc: 1719, gain: 0.7, q: 2.58 }
        ]
    },
    {
        name: "Beyerdynamic DT 770 Pro (250 Ohm)",
        preamp: -4.7,
        filters: [
            { type: "LSC", fc: 105, gain: 4.5, q: 0.70 },
            { type: "PK", fc: 210, gain: 4.8, q: 3.03 },
            { type: "PK", fc: 3495, gain: 5.8, q: 3.09 },
            { type: "PK", fc: 40, gain: -5.6, q: 0.74 },
            { type: "PK", fc: 8063, gain: -5.7, q: 0.67 },
            { type: "HSC", fc: 10000, gain: -11.4, q: 0.70 },
            { type: "PK", fc: 9553, gain: 5.1, q: 1.79 },
            { type: "PK", fc: 1552, gain: 1.1, q: 3.62 },
            { type: "PK", fc: 82, gain: 2.6, q: 6.00 },
            { type: "PK", fc: 64, gain: -1.2, q: 3.06 }
        ]
    },
    {
        name: "Beyerdynamic DT 880 (250 Ohm)",
        preamp: -6.0,
        filters: [
            { type: "LSC", fc: 105, gain: 6.0, q: 0.70 },
            { type: "PK", fc: 205, gain: -1.9, q: 0.98 },
            { type: "PK", fc: 1664, gain: 2.0, q: 1.00 },
            { type: "PK", fc: 5751, gain: -6.1, q: 5.35 },
            { type: "PK", fc: 71, gain: 1.0, q: 1.79 },
            { type: "HSC", fc: 10000, gain: -7.2, q: 0.70 },
            { type: "PK", fc: 4197, gain: 3.3, q: 3.61 },
            { type: "PK", fc: 2919, gain: -1.6, q: 4.15 },
            { type: "PK", fc: 7833, gain: -0.9, q: 6.00 },
            { type: "PK", fc: 555, gain: 0.5, q: 2.74 }
        ]
    },
    {
        name: "Beyerdynamic DT 990 Pro (250 Ohm)",
        preamp: -6.1,
        filters: [
            { type: "LSC", fc: 105, gain: 6.1, q: 0.70 },
            { type: "PK", fc: 564, gain: 2.2, q: 1.86 },
            { type: "PK", fc: 8240, gain: -6.0, q: 0.91 },
            { type: "PK", fc: 2070, gain: 2.6, q: 2.69 },
            { type: "PK", fc: 82, gain: 1.7, q: 4.34 },
            { type: "HSC", fc: 10000, gain: -15.8, q: 0.70 },
            { type: "PK", fc: 9052, gain: 6.4, q: 1.28 },
            { type: "PK", fc: 181, gain: -1.1, q: 2.55 },
            { type: "PK", fc: 4255, gain: 2.9, q: 6.00 },
            { type: "PK", fc: 5819, gain: -4.1, q: 5.58 }
        ]
    },
    {
        name: "Fifine Ampligame H3",
        preamp: -6.4,
        filters: [
            { type: "LSC", fc: 105, gain: -1.7, q: 0.70 },
            { type: "PK", fc: 172, gain: -9.6, q: 0.81 },
            { type: "PK", fc: 415, gain: 8.2, q: 1.16 },
            { type: "PK", fc: 252, gain: -3.1, q: 0.99 },
            { type: "PK", fc: 726, gain: 3.7, q: 0.91 },
            { type: "HSC", fc: 10000, gain: -3.0, q: 0.70 },
            { type: "PK", fc: 7643, gain: 3.8, q: 1.72 },
            { type: "PK", fc: 3174, gain: -5.1, q: 3.78 },
            { type: "PK", fc: 2009, gain: 1.8, q: 3.23 },
            { type: "PK", fc: 59, gain: 1.1, q: 3.88 }
        ]
    },
    {
        name: "Fifine Ampligame H6 (Music Mode)",
        preamp: -7.7,
        filters: [
            { type: "LSC", fc: 105, gain: 7.3, q: 0.70 },
            { type: "PK", fc: 275, gain: -14.3, q: 0.37 },
            { type: "PK", fc: 406, gain: 19.3, q: 0.90 },
            { type: "PK", fc: 1524, gain: 7.2, q: 1.41 },
            { type: "PK", fc: 3331, gain: -6.0, q: 1.42 },
            { type: "HSC", fc: 10000, gain: -5.8, q: 0.70 },
            { type: "PK", fc: 82, gain: -3.5, q: 3.29 },
            { type: "PK", fc: 150, gain: 1.3, q: 0.32 },
            { type: "PK", fc: 229, gain: -2.9, q: 3.77 },
            { type: "PK", fc: 836, gain: -2.5, q: 5.84 }
        ]
    },
    {
        name: "Sennheiser HD 280 Pro",
        preamp: -5.8,
        filters: [
            { type: "LSC", fc: 105, gain: 4.2, q: 0.70 },
            { type: "PK", fc: 138, gain: -6.8, q: 0.75 },
            { type: "PK", fc: 238, gain: 4.5, q: 1.22 },
            { type: "PK", fc: 8600, gain: -5.3, q: 2.50 },
            { type: "HSC", fc: 10000, gain: -3.2, q: 0.70 },
            { type: "PK", fc: 2800, gain: 2.5, q: 3.00 }
        ]
    },
    {
        name: "Sennheiser HD 600",
        preamp: -6.5,
        filters: [
            { type: "LSC", fc: 105, gain: 7.5, q: 0.70 },
            { type: "PK", fc: 3500, gain: -3.2, q: 1.50 },
            { type: "PK", fc: 7200, gain: 3.0, q: 3.00 },
            { type: "PK", fc: 145, gain: -2.1, q: 0.80 },
            { type: "HSC", fc: 10000, gain: -4.5, q: 0.70 }
        ]
    },
    {
        name: "Sennheiser HD 650",
        preamp: -6.8,
        filters: [
            { type: "LSC", fc: 105, gain: 6.8, q: 0.70 },
            { type: "PK", fc: 150, gain: -2.5, q: 0.60 },
            { type: "PK", fc: 8500, gain: 3.5, q: 2.80 },
            { type: "HSC", fc: 10000, gain: -5.2, q: 0.70 }
        ]
    },
    {
        name: "Sony MDR-ZX110",
        preamp: -3.5,
        filters: [
            { type: "LSC", fc: 105, gain: 2.5, q: 0.70 },
            { type: "PK", fc: 300, gain: -4.0, q: 1.20 },
            { type: "PK", fc: 2500, gain: 5.5, q: 1.50 },
            { type: "HSC", fc: 10000, gain: -8.0, q: 0.70 }
        ]
    },
    {
        name: "Shure SRH440",
        preamp: -4.2,
        filters: [
            { type: "LSC", fc: 105, gain: 3.0, q: 0.70 },
            { type: "PK", fc: 800, gain: -3.5, q: 1.00 },
            { type: "PK", fc: 4500, gain: 4.2, q: 2.00 },
            { type: "HSC", fc: 10000, gain: -5.5, q: 0.70 }
        ]
    }
];
