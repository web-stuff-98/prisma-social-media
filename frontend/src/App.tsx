import Layout from "./components/layout/Layout";
import { MessengerProvider } from "./context/MessengerContext";
import { InterfaceProvider } from "./context/InterfaceContext";
import { ModalProvider } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { UsersProvider } from "./context/UsersContext";

function App() {
  return (
    <InterfaceProvider>
        <SocketProvider>
        <UsersProvider>
          <ModalProvider>
            <AuthProvider>
              <MessengerProvider>
                <Layout />
              </MessengerProvider>
            </AuthProvider>
          </ModalProvider>
      </UsersProvider>
        </SocketProvider>
    </InterfaceProvider>
  );
}

export default App;
