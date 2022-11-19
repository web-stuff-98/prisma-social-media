//@ts-nocheck

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

/*

This script could be optimized....

https://usehooks.com/useCustomArrayAsync/

^ This hook, except I modified it so that it can be used in combination with socket.io to receive updates for items in an array.
  It will immediately run the asyncFunction to get the array, then it will use the update,create and delete item socket events
  to update the array. You can also pass it a sorting function, a filter function & use setValueState to immediately set the
  array value state using the normal (previousValue) => [...your return value from your callback]. If you are having problems
  with dates for example then you can also set stringifyAndParse to true to make sure that your dates are actually dates and
  not strings.

The value is supposed to be for example a list of users, rooms, messages, et cet. It will listen for
your create new item event, update item event and your delete item event on the socket.

Your serverside update and create socket event must be structured like this (it uses spread operator to create/update the item) :
    function = (id, {item data}) => {}

Your serverside delete item socket event must be structured like this :
    update = (id) => {}

itemUpdatedEventName = The name of your socket event for when an item in the array is updated
itemDeletedEventName = The name of your socket event for when an item in the array is deleted
itemCreatedEventName = The name of your socket event for when an item in the array is created

*/

const useCustomArrayAsync = (
  asyncFunction: Function,
  asyncFuncArgs: any[] | undefined,
  itemUpdatedEventName: string,
  itemDeletedEventName: string,
  itemCreatedEventName: string,
  sortFunction?: (a: any, b: any) => number,
  filterFunction: (item: any) => boolean = () => true
) => {
  const [status, setStatus] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const [value, setValue] = useState<any[]>([]);
  const [error, setError] = useState(null);

  const setValueState = (cb: (prevState: any[]) => any[]) => setValue(cb);

  const execute = useCallback(() => {
    setStatus("pending");
    setValue([]);
    setError(null);
    return asyncFunction(...asyncFuncArgs || undefined)
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
  const handleItemCreated = useCallback((id: string, data: any) => {
    console.log("Item created : " + JSON.stringify(id))
    setValue((p) =>
      sortFunction
        ? [...p, { id, ...data }].sort(sortFunction).filter(filterFunction)
        : [...p, { id, ...data }].filter(filterFunction)
    );
  }, []);
  const handleItemUpdated = useCallback((id: string, data: any) => {
    console.log("Item updated : " + JSON.stringify(data))
    setValue((p) => {
      let newVal = p;
      const i = p.findIndex((item) => item.id === id);
      newVal[i] = { ...newVal[i], ...data };
      return [
        ...(sortFunction ? newVal.sort(sortFunction) : newVal).filter(
          filterFunction
        ),
      ];
    });
  }, [value]);
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
    execute();
  }, [])

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
