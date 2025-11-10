import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  user: string | null;
  contract: any | null;
}

const initialState: AppState = {
  user: null,
  contract: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<string | null>) => {
      state.user = action.payload;
    },
    setContract: (state, action: PayloadAction<any | null>) => {
      state.contract = action.payload;
    },
    reset: (state) => {
      state.user = null;
      state.contract = null;
    },
  },
});

export const { setUser, setContract, reset } = appSlice.actions;
export default appSlice.reducer;
