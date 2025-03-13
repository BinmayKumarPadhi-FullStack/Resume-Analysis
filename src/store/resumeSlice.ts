import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ResumeState {
    file: File | null;
    loading: boolean;
    analysisResult: string;
};

const initialState: ResumeState = {
    file: null,
    loading: false,
    analysisResult: '',
}

const resumeSlice = createSlice({
    name: "resume",
    initialState,
    reducers: {
        uploadResumeStart: (state) => {
            state.loading = true;
            state.analysisResult = '';
        },
        uploadResumeSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.analysisResult = action.payload;
            console.log(state.analysisResult);
        },
        uploadResumeFailure: (state) => {
            state.loading = false;
            state.analysisResult = "Failed to Analysis"
        }
    }
});

export const { uploadResumeStart, uploadResumeSuccess, uploadResumeFailure } = resumeSlice.actions;
export default resumeSlice.reducer;