package com.uninotes.india.config;

import com.uninotes.india.entity.DatabaseSequence;
import com.uninotes.india.service.SequenceGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

@Component
public class MongoIdGeneratorListener implements BeforeConvertCallback<Object> {

    private final SequenceGeneratorService sequenceGeneratorService;

    @Autowired
    public MongoIdGeneratorListener(@Lazy SequenceGeneratorService sequenceGeneratorService) {
        this.sequenceGeneratorService = sequenceGeneratorService;
    }

    @Override
    public Object onBeforeConvert(Object entity, String collection) {
        if (entity instanceof DatabaseSequence) {
            return entity;
        }

        Class<?> clazz = entity.getClass();
        while (clazz != null) {
            for (Field field : clazz.getDeclaredFields()) {
                if (field.isAnnotationPresent(org.springframework.data.annotation.Id.class) || field.getName().equals("id")) {
                    field.setAccessible(true);
                    try {
                        Object idVal = field.get(entity);
                        if (field.getType().equals(Long.class) || field.getType().equals(long.class)) {
                            if (idVal == null || (Long) idVal == 0L) {
                                long nextId = sequenceGeneratorService.generateSequence(collection + "_sequence");
                                field.set(entity, nextId);
                            }
                        }
                    } catch (IllegalAccessException e) {
                        // ignore
                    }
                }

                if (field.getName().equals("updatedAt")) {
                    field.setAccessible(true);
                    try {
                        field.set(entity, LocalDateTime.now());
                    } catch (IllegalAccessException e) {
                        // ignore
                    }
                }

                if (field.getName().equals("createdAt")) {
                    field.setAccessible(true);
                    try {
                        Object val = field.get(entity);
                        if (val == null) {
                            field.set(entity, LocalDateTime.now());
                        }
                    } catch (IllegalAccessException e) {
                        // ignore
                    }
                }
            }
            clazz = clazz.getSuperclass();
        }
        return entity;
    }
}
