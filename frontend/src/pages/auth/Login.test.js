import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./Login";
describe("LoginPage", () => {
    it("renders email and password inputs", () => {
        render(_jsx(BrowserRouter, { children: _jsx(LoginPage, {}) }));
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
});
