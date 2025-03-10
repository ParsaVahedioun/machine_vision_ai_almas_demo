from ultralytics import YOLO

model = YOLO('best.pt')

results = model.predict(source='test0.mp4' , save=True , conf=0.2)

for r in results:
    print(r.boxes)
print(results)