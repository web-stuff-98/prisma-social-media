import Layout from "./components/layout/Layout";
import { MessengerProvider } from "./context/MessengerContext";
import { InterfaceProvider } from "./context/InterfaceContext";
import { ModalProvider } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <InterfaceProvider>
      <SocketProvider>
        <ModalProvider>
          <AuthProvider>
            <MessengerProvider>
              <Layout />
            </MessengerProvider>
          </AuthProvider>
        </ModalProvider>
      </SocketProvider>
    </InterfaceProvider>
  );
}

export default App;
