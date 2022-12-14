//@ts-nocheck

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

/*

This script could be optimized a bit.... filter function is being called with
return true even if there is no filter function being used

https://usehooks.com/useCustomArrayAsync/

^ This hook, except I modified it so that it can be used with socket.io to receive updates for items in an array.
  It will immediately run the asyncFunction to get the array, then it will use the update,create and delete item socket events
  to update the array. You can also pass it a sorting function, a filter function & use setValueState to set the
  array value state using the normal (previousValue) => [...your return value from your callback].

The value is supposed to be for example a list of users, rooms, messages, et cet. It will listen for
your create new item event, update item event and your delete item event on the socket.

Your serverside update and create socket event must be structured like this (it uses spread operator to create/update the item) :
    function = ({item data, including the id}) => {}

Your serverside delete item socket event must be structured like this :
    update = (id) => {}

itemUpdatedEventName = The name of your socket event for when an item in the array is updated
itemDeletedEventName = The name of your socket event for when an item in the array is deleted
itemCreatedEventName = The name of your socket event for when an item in the array is created

*/

const useCustomArrayAsync = (
  asyncFunction: Function,
  asyncFuncArgs: any[] = [],
  itemUpdatedEventName: string,
  itemDeletedEventName: string,
  itemCreatedEventName: string,
  sortFunction?: (a: any, b: any) => number,
  filterFunction: (item: any) => boolean = () => true,
  notImmediate?: boolean
) => {
  const [status, setStatus] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const [value, setValue] = useState<any[]>([]);
  const [error, setError] = useState(null);

  const setValueState = useCallback(
    (cb: (prevState: any[]) => any[]) => setValue(cb),
    []
  );

  const execute = useCallback(() => {
    setStatus("pending");
    setValue([]);
    setError(null);
    return asyncFunction(...asyncFuncArgs)
      .then((response: any[]) => {
        setValue(sortFunction ? response.sort(sortFunction) : response);
        setStatus("success");
      })
      .catch((error: any) => {
        setError(error);
        setStatus("error");
      });
  }, [asyncFunction]);

  const { socket } = useSocket();
  const handleItemCreated = useCallback((data: any) => {
    setValue((p) =>
      sortFunction
        ? [...p, data].sort(sortFunction).filter(filterFunction)
        : [...p, data].filter(filterFunction)
    );
  }, []);
  const handleItemUpdated = useCallback(
    (data: any) => {
      setValue((p) => {
        let newVal = p;
        const i = p.findIndex((item) => item.id === data.id);
        newVal[i] = { ...newVal[i], ...data };
        return [
          ...(sortFunction ? newVal.sort(sortFunction) : newVal).filter(
            filterFunction
          ),
        ];
      });
    },
    [value]
  );
  const handleItemDeleted = useCallback((id: string) => {
    setValue((p) => [
      ...(sortFunction
        ? p
            .filter((item) => item.id !== id)
            .sort(sortFunction)
            .filter(filterFunction)
        : p.filter((item) => item.id !== id).filter(filterFunction)),
    ]);
  }, []);

  useEffect(() => {
    if (!notImmediate) execute();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on(itemCreatedEventName, handleItemCreated);
    socket.on(itemUpdatedEventName, handleItemUpdated);
    socket.on(itemDeletedEventName, handleItemDeleted);
    return () => {
      socket.off(itemCreatedEventName, handleItemCreated);
      socket.off(itemUpdatedEventName, handleItemUpdated);
      socket.off(itemDeletedEventName, handleItemDeleted);
    };
  }, [socket]);

  return { execute, status, value, error, setValueState };
};

export default useCustomArrayAsync;
