# Offline Notice Relay Network for College Classrooms

## 📌 Project Overview

The **Offline Notice Relay Network for College Classrooms** is a browser-based simulation designed to demonstrate reliable notice delivery in a college environment, even when some classrooms experience temporary connectivity problems.

The system allows a teacher to create and transmit notices to different classrooms. If a classroom is offline, the notice is kept in a pending state and can be delivered when connectivity is restored.

The project demonstrates the **Store-and-Forward** concept and the basic idea of relay-based communication in computer networks.

---

## 🎯 Problem Statement

In colleges, important announcements such as examination schedules, timetable changes, laboratory updates, and emergency notices need to reach students quickly.

If a classroom temporarily loses network connectivity, students in that classroom may not receive the notice.

This project demonstrates a solution where notices can be retained temporarily and delivered when the classroom becomes available again.

---

## 💡 Objectives

- To provide a simple system for distributing notices to multiple classrooms.
- To simulate online and offline classroom connectivity.
- To demonstrate Store-and-Forward communication.
- To maintain pending notices for temporarily disconnected classrooms.
- To simulate retry and delivery after reconnection.
- To maintain a transmission log for monitoring notice delivery.

---

## ⚙️ Main Features

### 1. Teacher Notice Console
Allows the teacher to:
- Enter notice title.
- Enter notice message.
- Select notice priority.
- Send the notice through the simulated network.

### 2. Classroom Network
The simulation contains multiple classroom nodes:

- Classroom A
- Classroom B
- Classroom C

Each classroom can be switched between **Online** and **Offline** status.

### 3. Offline Notice Handling
When a classroom is offline, the notice is kept in a pending state instead of being treated as successfully delivered.

### 4. Reconnection and Retry
When the classroom becomes online again, the system can resume the pending delivery.

### 5. Student Notice Board
Displays notices that have been successfully delivered.

### 6. Packet Transmission Log
Displays important events during the transmission process, such as:

- Notice transmission started
- Classroom status
- Notice delivered
- Notice pending
- Classroom reconnected
- Retry performed
- Transmission completed

### 7. Search and Priority
Users can search notices and identify important notices using priority levels.

### 8. Reset
The simulation can be reset to perform another demonstration.

---

## 🏗️ System Architecture

The basic flow of the system is:

```text
             Teacher
                |
                v
       Teacher Notice Console
                |
                v
        Notice Processing
                |
        +-------+-------+
        |       |       |
        v       v       v
    Class A  Class B  Class C
    Online   Offline   Online
        |       |       |
        v       v       v
     Notice   Pending   Notice
     Board    Notice    Board
                |
                v
        Classroom Reconnects
                |
                v
          Retry Delivery
