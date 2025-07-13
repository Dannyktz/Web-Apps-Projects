largest_number = 0

while True:
    number = int(input("Enter positive number : "))
    
    if number > largest_number:
        largest_number = number
    elif number == 0:
        break
    else:
        print("Largest number is " , largest_number)
    

print("Largest number is " , largest_number)