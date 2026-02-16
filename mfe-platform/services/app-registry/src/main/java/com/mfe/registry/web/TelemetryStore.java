package com.mfe.registry.web;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class TelemetryStore {

    private static final int MAX_EVENTS = 500;
    private final Deque<TelemetryController.TelemetryRecord> events = new ArrayDeque<>();

    public synchronized void add(TelemetryController.TelemetryRecord record) {
        events.addFirst(record);
        while (events.size() > MAX_EVENTS) {
            events.removeLast();
        }
    }

    public synchronized List<TelemetryController.TelemetryRecord> list() {
        return new ArrayList<>(events);
    }
}
