import Layout from "./components/layout/Layout";
import { MessengerProvider } from "./context/MessengerContext";
import { InterfaceProvider } from "./context/InterfaceContext";
import { ModalProvider } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { UsersProvider } from "./context/UsersContext";
import { UserdropdownProvider } from "./context/UserdropdownContext";

function App() {
  return (
    <InterfaceProvider>
      <SocketProvider>
        <UsersProvider>
          <ModalProvider>
            <UserdropdownProvider>
              <AuthProvider>
                <MessengerProvider>
                  <Layout />
                </MessengerProvider>
              </AuthProvider>
            </UserdropdownProvider>
          </ModalProvider>
        </UsersProvider>
      </SocketProvider>
    </InterfaceProvider>
  );
}

export default App;
