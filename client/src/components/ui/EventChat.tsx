import { useEffect, useRef, useState } from "react"
import { getSocket } from "../../hooks/useSocket"
import {
  eventService,
  useCreateMessageMutation,
  useGetEventMessagesQuery,
} from "../../services/EventService"
import { IEventMessage } from "../../shared/interfaces/models"
import { useAppDispatch } from "../../store/store"
import ChatTab from "./chat/ChatTab"

interface IEventChatProps {
  eventId: number
  currentUserId: number
  currentUsername: string
  currentUserAvatar?: string
}

const EventChat = ({
  eventId,
  currentUserId,
}: Omit<IEventChatProps, "currentUsername" | "currentUserAvatar">) => {
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  const numericEventId = Number(eventId)

  const {
    data: messages = [],
    isLoading,
    error,
  } = useGetEventMessagesQuery(numericEventId)
  const [createMessage, { isLoading: isSending }] = useCreateMessageMutation()

  const socketInstance = getSocket()
  const [isConnected, setIsConnected] = useState(
    socketInstance?.connected ?? false
  )

  // Monitor socket connection status
  useEffect(() => {
    if (!socketInstance) {
      setIsConnected(false)
      return
    }

    setIsConnected(socketInstance.connected)

    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    socketInstance.on("connect", handleConnect)
    socketInstance.on("disconnect", handleDisconnect)

    return () => {
      socketInstance.off("connect", handleConnect)
      socketInstance.off("disconnect", handleDisconnect)
    }
  }, [socketInstance])

  // WebSocket integration
  useEffect(() => {
    if (!socketInstance) return

    // Wait for connection before joining room
    const joinRoom = () => {
      if (socketInstance && socketInstance.connected) {
        socketInstance.emit("join-event", numericEventId)
      }
    }

    if (socketInstance.connected) {
      joinRoom()
    } else {
      socketInstance.once("connect", joinRoom)
    }

    // Listen for new messages
    const handleNewMessage = (message: IEventMessage) => {
      dispatch(
        eventService.util.updateQueryData(
          "getEventMessages",
          numericEventId,
          (draft) => {
            const exists = draft.find((m) => m.id === message.id)
            if (!exists) {
              draft.push(message)
            }
          }
        )
      )
      setTimeout(scrollToBottom, 100)
    }

    // Listen for deleted messages
    const handleMessageDeleted = (messageId: number) => {
      dispatch(
        eventService.util.updateQueryData(
          "getEventMessages",
          numericEventId,
          (draft) => {
            return draft.filter((m) => m.id !== messageId)
          }
        )
      )
    }

    socketInstance.on("new-message", handleNewMessage)
    socketInstance.on("message-deleted", handleMessageDeleted)

    return () => {
      if (socketInstance) {
        if (socketInstance.connected) {
          socketInstance.emit("leave-event", numericEventId)
        }
        socketInstance.off("new-message", handleNewMessage)
        socketInstance.off("message-deleted", handleMessageDeleted)
        socketInstance.off("connect", joinRoom)
      }
    }
  }, [numericEventId, dispatch, socketInstance])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    try {
      await createMessage({
        eventId: numericEventId,
        message: newMessage.trim(),
      }).unwrap()
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }
  return (
    <ChatTab
      isLoading={isLoading}
      error={!!error}
      isConnected={isConnected}
      messages={messages}
      currentUserId={currentUserId}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      handleSendMessage={handleSendMessage}
      isSending={isSending}
      messagesEndRef={messagesEndRef}
    />
  )
}

export default EventChat
