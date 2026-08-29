export const pick = jest.fn();
export const isErrorWithCode = jest.fn(() => false);
export const errorCodes = {OPERATION_CANCELED: 'OPERATION_CANCELED'};
export const types = {allFiles: '*/*'};

export default {pick, isErrorWithCode, errorCodes, types};
