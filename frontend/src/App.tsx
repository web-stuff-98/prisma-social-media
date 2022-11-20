import Layout from "./components/layout/Layout";
import { ChatProvider } from "./context/ChatContext";
import { InterfaceProvider } from "./context/InterfaceContext";
import { ModalProvider } from "./context/ModalContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { UsersProvider } from "./context/UsersContext";
import { UserdropdownProvider } from "./context/UserdropdownContext";
import { PostsProvider } from "./context/PostsContext";

function App() {
  return (
    <InterfaceProvider>
      <SocketProvider>
        <UsersProvider>
          <ModalProvider>
            <UserdropdownProvider>
              <AuthProvider>
                <ChatProvider>
                  <PostsProvider>
                    <Layout />
                  </PostsProvider>
                </ChatProvider>
              </AuthProvider>
            </UserdropdownProvider>
          </ModalProvider>
        </UsersProvider>
      </SocketProvider>
    </InterfaceProvider>
  );
}

export default App;
