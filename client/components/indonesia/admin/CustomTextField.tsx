import { styled, TextField } from "@mui/material";

const CustomTextField = styled(TextField)<{ textalign?: "left" | "right" }>(({ textalign = "left" }) => ({
	marginBottom: 8,
	"& .MuiOutlinedInput-root": {
		backgroundColor: "rgba(255, 255, 255, 0.03)",
		color: "#fff",
		borderRadius: "16px",
		"& fieldset": {
			borderColor: "#282D29",
		},
		"&:hover fieldset": {
			borderColor: "#22C55F",
		},
		"&.Mui-focused fieldset": {
			borderColor: "#22C55F",
		},
		"& input": {
			fontFeatureSettings: "'tnum' on, 'lnum' on",
			textAlign: textalign,
			paddingRight: "8px",
			fontSize: "1rem",
			letterSpacing: "0.5px",
		},
	},
	"& .MuiFormLabel-root": {
		color: "rgba(255, 255, 255, 0.7)",
	},
	"& .MuiFormHelperText-root": {
		fontSize: "0.75rem",
	},
}));

export default CustomTextField;
