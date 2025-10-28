const PRIMARY_COLORS = {
    // Neutral
    neutral000: 'rgb(255, 255, 255)',
    neutral100: 'rgb(230, 236, 242)',
    neutral200: 'rgb(171, 181, 191)',
    neutral300: 'rgb(126, 135, 146)',
    neutral400: 'rgb(77, 86, 95)',
    neutral500: 'rgb(59, 67, 76)',
    neutral600: 'rgb(39, 47, 56)',
    neutral700: 'rgb(30, 36, 44)',
    neutral800: 'rgb(18, 24, 31)',
    neutral900: 'rgb(6, 11, 16)',

    // Teal
    teal000: 'rgb(222, 255, 254)',
    teal100: 'rgb(142, 251, 247)',
    teal200: 'rgb(50, 230, 226)',
    teal300: 'rgb(20, 216, 212)',
    teal400: 'rgb(5, 189, 186)',
    teal500: 'rgb(4, 162, 159)',
    teal600: 'rgb(2, 128, 125)',
    teal700: 'rgb(1, 105, 104)',
    teal800: 'rgb(1, 72, 71)',
    teal900: 'rgb(12, 42, 42)',

    // Green
    green000: 'rgb(231, 252, 233)',
    green100: 'rgb(190, 249, 198)',
    green200: 'rgb(147, 245, 165)',
    green300: 'rgb(100, 216, 127)',
    green400: 'rgb(58, 195, 100)',
    green500: 'rgb(49, 168, 85)',
    green600: 'rgb(34, 130, 64)',
    green700: 'rgb(26, 107, 52)',
    green800: 'rgb(15, 74, 33)',
    green900: 'rgb(21, 42, 25)',

    // Gold
    gold000: 'rgb(253, 245, 216)',
    gold100: 'rgb(246, 224, 165)',
    gold200: 'rgb(250, 205, 111)',
    gold300: 'rgb(251, 177, 61)',
    gold400: 'rgb(249, 142, 33)',
    gold500: 'rgb(213, 119, 26)',
    gold600: 'rgb(168, 93, 19)',
    gold700: 'rgb(140, 76, 13)',
    gold800: 'rgb(96, 52, 8)',
    gold900: 'rgb(51, 34, 19)',

    // Red
    red000: 'rgb(251, 238, 237)',
    red100: 'rgb(251, 211, 208)',
    red200: 'rgb(255, 189, 186)',
    red300: 'rgb(255, 173, 169)',
    red400: 'rgb(254, 131, 130)',
    red500: 'rgb(254, 78, 92)',
    red600: 'rgb(214, 39, 64)',
    red700: 'rgb(175, 37, 54)',
    red800: 'rgb(128, 10, 32)',
    red900: 'rgb(61, 28, 27)',

    // Pink
    pink000: 'rgb(252, 240, 251)',
    pink100: 'rgb(246, 210, 242)',
    pink200: 'rgb(247, 188, 243)',
    pink300: 'rgb(243, 168, 238)',
    pink400: 'rgb(239, 127, 235)',
    pink500: 'rgb(223, 90, 220)',
    pink600: 'rgb(185, 56, 184)',
    pink700: 'rgb(154, 45, 153)',
    pink800: 'rgb(108, 29, 107)',
    pink900: 'rgb(56, 27, 55)',

    // Purple
    purple000: 'rgb(245, 242, 252)',
    purple100: 'rgb(226, 217, 247)',
    purple200: 'rgb(216, 199, 255)',
    purple300: 'rgb(202, 185, 244)',
    purple400: 'rgb(180, 157, 241)',
    purple500: 'rgb(155, 128, 237)',
    purple600: 'rgb(119, 92, 231)',
    purple700: 'rgb(97, 74, 202)',
    purple800: 'rgb(56, 42, 164)',
    purple900: 'rgb(41, 33, 66)',

    // Blue
    blue000: 'rgb(237, 244, 255)',
    blue100: 'rgb(205, 226, 255)',
    blue200: 'rgb(181, 210, 251)',
    blue300: 'rgb(156, 190, 246)',
    blue400: 'rgb(128, 171, 250)',
    blue500: 'rgb(93, 141, 245)',
    blue600: 'rgb(49, 107, 244)',
    blue700: 'rgb(46, 81, 237)',
    blue800: 'rgb(32, 54, 161)',
    blue900: 'rgb(27, 32, 91)',
}

export const COLORS = {
    ...PRIMARY_COLORS,

    // Background colors
    bgApp: PRIMARY_COLORS.neutral900,
    bgDark: PRIMARY_COLORS.neutral700,
    bgDarker: PRIMARY_COLORS.neutral800,
    bgLight: PRIMARY_COLORS.neutral600,
    bgLighter: PRIMARY_COLORS.neutral500,

    // Text colors
    textLoud: PRIMARY_COLORS.neutral000,
    text: PRIMARY_COLORS.neutral000,
    textMuted: PRIMARY_COLORS.neutral200,
    placeholder: PRIMARY_COLORS.neutral200,
    textInverse: PRIMARY_COLORS.neutral000,
    textMutedInverse: PRIMARY_COLORS.neutral300,

    white: PRIMARY_COLORS.neutral000, // not present in original
    black: PRIMARY_COLORS.neutral900, // modified from .800 to .900

    grayDarkest: PRIMARY_COLORS.neutral700,
    grayDarker: PRIMARY_COLORS.neutral600,
    grayDark: PRIMARY_COLORS.neutral500,
    gray: PRIMARY_COLORS.neutral400,
    grayLight: PRIMARY_COLORS.neutral300,
    grayLighter: PRIMARY_COLORS.neutral200,
    grayLightest: PRIMARY_COLORS.neutral100,

    tealDarkest: PRIMARY_COLORS.teal900,
    tealDarker: PRIMARY_COLORS.teal700,
    teal: PRIMARY_COLORS.teal500,
    tealAction: PRIMARY_COLORS.teal300,
    tealLighter: PRIMARY_COLORS.teal200,
    tealLightest: PRIMARY_COLORS.teal100,

    blueDarkest: PRIMARY_COLORS.blue900,
    blueDarker: PRIMARY_COLORS.blue800,
    blue: PRIMARY_COLORS.blue700,
    blueLighter: PRIMARY_COLORS.blue500,
    blueLightest: PRIMARY_COLORS.blue100,

    goldDarkest: PRIMARY_COLORS.gold900,
    goldDarker: PRIMARY_COLORS.gold600,
    gold: PRIMARY_COLORS.gold400,
    goldLighter: PRIMARY_COLORS.gold200,
    goldLightest: PRIMARY_COLORS.gold100,

    redDarkest: PRIMARY_COLORS.red900,
    redDarker: PRIMARY_COLORS.red700,
    red: PRIMARY_COLORS.red500,
    redLighter: PRIMARY_COLORS.red300,
    redLightest: PRIMARY_COLORS.red100,

    greenDarkest: PRIMARY_COLORS.green900,
    greenDarker: PRIMARY_COLORS.green700,
    green: PRIMARY_COLORS.green500,
    greenLighter: PRIMARY_COLORS.green200,
    greenLightest: PRIMARY_COLORS.green100,

    purpleDarkest: PRIMARY_COLORS.purple900,
    purpleDarker: PRIMARY_COLORS.purple700,
    purple: PRIMARY_COLORS.purple500,
    purpleLighter: PRIMARY_COLORS.purple200,
    purpleLightest: PRIMARY_COLORS.purple100,

    // Border colors
    hr: PRIMARY_COLORS.neutral600, // grayDarker
}
